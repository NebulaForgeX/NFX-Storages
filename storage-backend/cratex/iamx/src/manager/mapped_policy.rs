// Mapped policy-related methods for IamSys

use crate::error::{Error, Result, is_err_no_such_policy};
use crate::repository::{GroupRepository, MappedPolicyRepository, UserIdentityRepository, PolicyRepository};
use crate::types::{MappedPolicy, UserType};
use crate::sys::STATUS_DISABLED;
use std::collections::{HashMap, HashSet};
use time::OffsetDateTime;

// Extension trait to expose policy_db_get_internal to other modules
pub(crate) trait IamSysMappedPolicyExt {
    async fn policy_db_get_internal(
        &self,
        name: &str,
        is_group: bool,
        policy_present: bool,
    ) -> Result<(Vec<String>, OffsetDateTime)>;
    async fn get_mapped_policy(&self, name: &str, is_group: bool) -> Option<MappedPolicy>;
    async fn policy_db_get(&self, name: &str, groups: &Option<Vec<String>>) -> Result<Vec<String>>;
    async fn policy_db_set(&self, name: &str, user_type: UserType, is_group: bool, policy: &str) -> Result<OffsetDateTime>;
    async fn policy_mapping_notification_handler(&self, name: &str, user_type: UserType, is_group: bool) -> Result<()>;
}

impl IamSysMappedPolicyExt for crate::sys::IamSys {
    async fn policy_db_get_internal(
        &self,
        name: &str,
        is_group: bool,
        _policy_present: bool,
    ) -> Result<(Vec<String>, OffsetDateTime)> {
        if is_group {
            // Load group from database
            let mut groups_map = HashMap::new();
            GroupRepository::load_group(&self.pool, name, &mut groups_map).await
                .map_err(|e| Error::other(format!("Failed to load group: {}", e)))?;

            let g = groups_map.get(name)
                .cloned()
                .ok_or(Error::NoSuchGroup(name.to_string()))?;

            if g.status == STATUS_DISABLED {
                return Ok((Vec::new(), OffsetDateTime::now_utc()));
            }

            // Load group policy
            let mut policy_map = HashMap::new();
                    if let Err(err) = MappedPolicyRepository::load_mapped_policy(&self.pool, name, UserType::Reg, true, &mut policy_map).await {
                // Convert sqlx::Error to Error
                let converted_err = Error::other(format!("{}", err));
                if !is_err_no_such_policy(&converted_err) {
                    return Err(converted_err);
                }
            }
            
            if let Some(p) = policy_map.get(name) {
                return Ok((p.to_slice(), p.update_at));
            }

            return Ok((Vec::new(), OffsetDateTime::now_utc()));
        }

        // Load user from database
        let mut users_map = HashMap::new();
        UserIdentityRepository::load_user(&self.pool, name, UserType::Reg, &mut users_map).await
            .map_err(|e| Error::other(format!("Failed to load user: {}", e)))?;
        
        let u = users_map.get(name).cloned().unwrap_or_default();
        if !u.credentials.is_valid() {
            return Ok((Vec::new(), OffsetDateTime::now_utc()));
        }

        // Load user policy
        let mut policy_map = HashMap::new();
        let mp = if MappedPolicyRepository::load_mapped_policy(&self.pool, name, UserType::Reg, false, &mut policy_map).await.is_ok() {
            if let Some(p) = policy_map.get(name) {
                p.clone()
            } else {
                // Try STS policy
                let mut sts_policy_map = HashMap::new();
                if MappedPolicyRepository::load_mapped_policy(&self.pool, name, UserType::Sts, false, &mut sts_policy_map).await.is_ok() {
                    sts_policy_map.get(name).cloned().unwrap_or_default()
                } else {
                    MappedPolicy::default()
                }
            }
        } else {
            MappedPolicy::default()
        };

        let mut policies: HashSet<String> = mp.to_slice().into_iter().collect();
        let update_at = mp.update_at;

        // Load groups from user's credentials
        if let Some(groups) = u.credentials.groups.as_ref() {
            for group in groups.iter() {
                // Check if group is disabled
                let mut groups_map = HashMap::new();
                if GroupRepository::load_group(&self.pool, group, &mut groups_map).await.is_ok() {
                    if let Some(g) = groups_map.get(group) {
                        if g.status == STATUS_DISABLED {
                            return Ok((Vec::new(), OffsetDateTime::now_utc()));
                        }
                    }
                }

                // Load group policy
                let mut group_policy_map = HashMap::new();
                if MappedPolicyRepository::load_mapped_policy(&self.pool, group, UserType::Reg, true, &mut group_policy_map).await.is_ok() {
                    if let Some(p) = group_policy_map.get(group) {
                        p.to_slice().iter().for_each(|v| {
                            policies.insert(v.clone());
                        });
                    }
                }
            }
        }

        // Load groups from group memberships
        let mut all_groups_map = HashMap::new();
        if GroupRepository::load_groups(&self.pool, &mut all_groups_map).await.is_ok() {
            for (group_name, group) in all_groups_map.iter() {
                if group.members.contains(&name.to_string()) {
                    if group.status == STATUS_DISABLED {
                        return Ok((Vec::new(), OffsetDateTime::now_utc()));
                    }

                    // Load group policy
                    let mut group_policy_map = HashMap::new();
                    if MappedPolicyRepository::load_mapped_policy(&self.pool, group_name, UserType::Reg, true, &mut group_policy_map).await.is_ok() {
                        if let Some(p) = group_policy_map.get(group_name) {
                            p.to_slice().iter().for_each(|v| {
                                policies.insert(v.clone());
                            });
                        }
                    }
                }
            }
        }

        Ok((policies.into_iter().collect(), update_at))
    }

    async fn get_mapped_policy(&self, name: &str, is_group: bool) -> Option<MappedPolicy> {
        let mut policy_map = HashMap::new();
        let user_type = if is_group { UserType::Reg } else { UserType::Reg };
        
                if MappedPolicyRepository::load_mapped_policy(&self.pool, name, user_type, is_group, &mut policy_map)
            .await
            .is_ok()
        {
            policy_map.get(name).cloned()
        } else {
            None
        }
    }

    async fn policy_db_get(&self, name: &str, groups: &Option<Vec<String>>) -> Result<Vec<String>> {
        if name.is_empty() {
            return Err(Error::InvalidArgument);
        }

        let (mut policies, _) = self.policy_db_get_internal(name, false, false).await?;
        let present = !policies.is_empty();

        if let Some(groups) = groups {
            for group in groups.iter() {
                let (gp, _) = self.policy_db_get_internal(group, true, present).await?;
                gp.iter().for_each(|v| {
                    policies.push(v.clone());
                });
            }
        }

        Ok(policies)
    }

    async fn policy_db_set(&self, name: &str, user_type: UserType, is_group: bool, policy: &str) -> Result<OffsetDateTime> {
        if name.is_empty() {
            return Err(Error::InvalidArgument);
        }

        if policy.is_empty() {
            MappedPolicyRepository::delete(&self.pool, name, user_type, is_group).await
                .map_err(|e| Error::other(format!("Failed to delete mapped policy: {}", e)))?;
            return Ok(OffsetDateTime::now_utc());
        }

        let mp = MappedPolicy::new(policy);

        // Verify all policies exist
        let mut policy_docs_map = HashMap::new();
        for p in mp.to_slice() {
            if !p.is_empty() {
                PolicyRepository::load_policy_doc(&self.pool, &p, &mut policy_docs_map)
                    .await
                    .map_err(|e| Error::other(format!("Failed to load policy doc: {}", e)))?;
                
                if !policy_docs_map.contains_key(&p) {
                    return Err(Error::NoSuchPolicy);
                }
            }
        }

        MappedPolicyRepository::save(&self.pool, name, user_type, is_group, &mp).await
            .map_err(|e| Error::other(format!("Failed to save mapped policy: {}", e)))?;

        Ok(OffsetDateTime::now_utc())
    }

    async fn policy_mapping_notification_handler(&self, name: &str, user_type: UserType, is_group: bool) -> Result<()> {
        // Policy mapping notification handler - no cache operations needed
        // Data will be queried directly from database when needed
        let mut m = HashMap::new();
                    if let Err(err) = MappedPolicyRepository::load_mapped_policy(&self.pool, name, user_type, is_group, &mut m).await {
            // Convert sqlx::Error to Error
            let converted_err = Error::other(format!("{}", err));
            if !is_err_no_such_policy(&converted_err) {
                return Err(converted_err);
            }
            // Policy mapping not found - nothing to do
        }

        Ok(())
    }
}

