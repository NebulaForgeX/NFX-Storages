// Policy-related methods for IamSys

use crate::error::{Error, Result, is_err_no_such_policy};
use crate::repository::{PolicyRepository, MappedPolicyRepository, UserIdentityRepository, GroupRepository};
use crate::manager::utils::{set_default_canned_policies};
use crate::types::{MappedPolicy, UserType};
use nebulafx_madmin::AccountStatus;
use nebulafx_policy::policy::{Policy, PolicyDoc};
use std::collections::HashMap;
use time::OffsetDateTime;

pub(crate) trait IamSysPolicyExt {
    async fn get_policy(&self, name: &str) -> Result<Policy>;
    async fn get_policy_doc(&self, name: &str) -> Result<PolicyDoc>;
    async fn delete_policy(&self, name: &str, is_from_notify: bool) -> Result<()>;
    async fn set_policy(&self, name: &str, policy: Policy) -> Result<OffsetDateTime>;
    async fn list_polices(&self, bucket_name: &str) -> Result<HashMap<String, Policy>>;
    async fn merge_policies(&self, name: &str) -> (String, Policy);
    async fn list_policy_docs(&self, bucket_name: &str) -> Result<HashMap<String, PolicyDoc>>;
    async fn list_policy_docs_internal(&self, bucket_name: &str) -> Result<HashMap<String, PolicyDoc>>;
    async fn get_bucket_users(&self, bucket_name: &str) -> Result<HashMap<String, nebulafx_madmin::UserInfo>>;
    async fn policy_notification_handler(&self, policy: &str) -> Result<()>;
}

impl IamSysPolicyExt for crate::sys::IamSys {
    async fn get_policy(&self, name: &str) -> Result<Policy> {
        if name.is_empty() {
            return Err(Error::InvalidArgument);
        }

        let policies = MappedPolicy::new(name).to_slice();

        let mut to_merge = Vec::new();
        let mut policy_docs_map = HashMap::new();
        
        for policy in policies {
            if policy.is_empty() {
                continue;
            }

            if !policy_docs_map.contains_key(&policy) {
                PolicyRepository::load_policy_doc(&self.pool, &policy, &mut policy_docs_map)
                    .await
                    .map_err(|e| Error::other(format!("Failed to load policy doc: {}", e)))?;
            }

            if let Some(v) = policy_docs_map.get(&policy) {
                to_merge.push(v.policy.clone());
            }
        }

        if to_merge.is_empty() {
            return Err(Error::NoSuchPolicy);
        }

        Ok(Policy::merge_policies(to_merge))
    }

    async fn get_policy_doc(&self, name: &str) -> Result<PolicyDoc> {
        if name.is_empty() {
            return Err(Error::InvalidArgument);
        }

        let mut policy_docs_map = HashMap::new();
        PolicyRepository::load_policy_doc(&self.pool, name, &mut policy_docs_map)
            .await
            .map_err(|e| Error::other(format!("Failed to load policy doc: {}", e)))?;
        
        policy_docs_map.get(name).cloned().ok_or(Error::NoSuchPolicy)
    }

    async fn delete_policy(&self, name: &str, is_from_notify: bool) -> Result<()> {
        if name.is_empty() {
            return Err(Error::InvalidArgument);
        }

        if is_from_notify {
            // Check if policy is in use by users
            let mut user_policies = HashMap::new();
            MappedPolicyRepository::load_mapped_policies(&self.pool, UserType::Reg, false, &mut user_policies)
                .await
                .map_err(|e| Error::other(format!("Failed to load user policies: {}", e)))?;

            let mut users = Vec::new();
            for (k, v) in user_policies.iter() {
                if v.policy_set().contains(name) {
                    // Verify user still exists
                    let mut users_map = HashMap::new();
                    if UserIdentityRepository::load_user(&self.pool, k, UserType::Reg, &mut users_map)
                        .await
                        .is_ok()
                    {
                        if users_map.contains_key(k) {
                            users.push(k.clone());
                        }
                    }
                }
            }

            // Check if policy is in use by groups
            let mut group_policies = HashMap::new();
            MappedPolicyRepository::load_mapped_policies(&self.pool, UserType::Reg, true, &mut group_policies)
                .await
                .map_err(|e| Error::other(format!("Failed to load group policies: {}", e)))?;

            let mut groups = Vec::new();
            for (k, v) in group_policies.iter() {
                if v.policy_set().contains(name) {
                    groups.push(k.clone());
                }
            }

            if !users.is_empty() || !groups.is_empty() {
                return Err(Error::PolicyInUse);
            }

            if let Err(err) = PolicyRepository::delete(&self.pool, name).await {
                let sqlx_err = err;
                if sqlx_err.as_database_error().is_none() {
                    return Ok(());
                }
                return Err(Error::other(format!("Failed to delete policy: {}", sqlx_err)));
            }
        } else {
            // Direct delete
            PolicyRepository::delete(&self.pool, name).await
                .map_err(|e| Error::other(format!("Failed to delete policy: {}", e)))?;
        }

        Ok(())
    }

    async fn set_policy(&self, name: &str, policy: Policy) -> Result<OffsetDateTime> {
        if name.is_empty() || policy.is_empty() {
            return Err(Error::InvalidArgument);
        }

        // Try to load existing policy
        let mut policy_docs_map = HashMap::new();
        let policy_doc = if PolicyRepository::load_policy_doc(&self.pool, name, &mut policy_docs_map)
            .await
            .is_ok()
        {
            if let Some(existing) = policy_docs_map.get(name) {
                let mut p = existing.clone();
                p.update(policy.clone());
                p
            } else {
                PolicyDoc::new(policy)
            }
        } else {
            PolicyDoc::new(policy)
        };

        PolicyRepository::save(&self.pool, name, &policy_doc).await
            .map_err(|e| Error::other(format!("Failed to save policy: {}", e)))?;

        Ok(OffsetDateTime::now_utc())
    }

    async fn list_polices(&self, bucket_name: &str) -> Result<HashMap<String, Policy>> {
        let mut m = HashMap::new();

        PolicyRepository::load_policy_docs(&self.pool, &mut m).await
            .map_err(|e| Error::other(format!("Failed to load policy docs: {}", e)))?;
        set_default_canned_policies(&mut m);

        let ret = m
            .into_iter()
            .filter(|(_, v)| bucket_name.is_empty() || v.policy.match_resource(bucket_name))
            .map(|(k, v)| (k, v.policy))
            .collect();

        Ok(ret)
    }

    async fn merge_policies(&self, name: &str) -> (String, Policy) {
        let mut policies = Vec::new();
        let mut to_merge = Vec::new();
        let mut policy_docs_map = HashMap::new();

        for policy in MappedPolicy::new(name).to_slice() {
            if policy.is_empty() {
                continue;
            }

            if !policy_docs_map.contains_key(&policy) {
                let _ = PolicyRepository::load_policy_doc(&self.pool, &policy, &mut policy_docs_map)
                    .await
                    .map_err(|e| Error::other(format!("Failed to load policy doc: {}", e)));
            }

            if let Some(v) = policy_docs_map.get(&policy) {
                policies.push(policy);
                to_merge.push(v.policy.clone());
            }
        }

        (policies.join(","), Policy::merge_policies(to_merge))
    }

    async fn list_policy_docs(&self, bucket_name: &str) -> Result<HashMap<String, PolicyDoc>> {
        let mut m = HashMap::new();

        PolicyRepository::load_policy_docs(&self.pool, &mut m).await
            .map_err(|e| Error::other(format!("Failed to load policy docs: {}", e)))?;
        set_default_canned_policies(&mut m);

        let ret = m
            .into_iter()
            .filter(|(_, v)| bucket_name.is_empty() || v.policy.match_resource(bucket_name))
            .collect();

        Ok(ret)
    }

    async fn list_policy_docs_internal(&self, bucket_name: &str) -> Result<HashMap<String, PolicyDoc>> {
        let mut m = HashMap::new();

        PolicyRepository::load_policy_docs(&self.pool, &mut m).await
            .map_err(|e| Error::other(format!("Failed to load policy docs: {}", e)))?;
        set_default_canned_policies(&mut m);

        let ret = m
            .into_iter()
            .filter(|(_, v)| bucket_name.is_empty() || v.policy.match_resource(bucket_name))
            .collect();

        Ok(ret)
    }

    async fn get_bucket_users(&self, bucket_name: &str) -> Result<HashMap<String, nebulafx_madmin::UserInfo>> {
        use crate::manager::utils::filter_policies;
        
        // Load all Reg users
        let mut users_map = HashMap::new();
        UserIdentityRepository::load_users(&self.pool, UserType::Reg, &mut users_map)
            .await
            .map_err(|e| Error::other(format!("Failed to load users: {}", e)))?;

        // Load all user policies
        let mut user_policies = HashMap::new();
        MappedPolicyRepository::load_mapped_policies(&self.pool, UserType::Reg, false, &mut user_policies)
            .await
            .map_err(|e| Error::other(format!("Failed to load user policies: {}", e)))?;

        // Load all groups
        let mut groups_map = HashMap::new();
        GroupRepository::load_groups(&self.pool, &mut groups_map)
            .await
            .map_err(|e| Error::other(format!("Failed to load groups: {}", e)))?;

        // Load all group policies
        let mut group_policies = HashMap::new();
        MappedPolicyRepository::load_mapped_policies(&self.pool, UserType::Reg, true, &mut group_policies)
            .await
            .map_err(|e| Error::other(format!("Failed to load group policies: {}", e)))?;

        // Load all policy docs
        let mut policy_docs = HashMap::new();
        PolicyRepository::load_policy_docs(&self.pool, &mut policy_docs)
            .await
            .map_err(|e| Error::other(format!("Failed to load policy docs: {}", e)))?;

        let mut ret = HashMap::new();

        for (k, v) in users_map.iter() {
            if v.credentials.is_temp() || v.credentials.is_service_account() {
                continue;
            }

            let mut policies = Vec::new();
            if let Some(p) = user_policies.get(k) {
                policies.push(p.policies.clone());

                // Find groups this user belongs to
                let mut user_groups = Vec::new();
                for (group_name, group) in groups_map.iter() {
                    if group.members.contains(&k.to_string()) {
                        user_groups.push(group_name.clone());
                    }
                }

                for group in user_groups.iter() {
                    if let Some(p) = group_policies.get(group) {
                        policies.push(p.policies.clone());
                    }
                }
            }

            let matched_policies = filter_policies(&policy_docs, &policies.join(","), bucket_name).0;
            if matched_policies.is_empty() {
                continue;
            }

            let mut u = nebulafx_madmin::UserInfo {
                policy_name: Some(matched_policies),
                status: if v.credentials.is_valid() {
                    AccountStatus::Enabled
                } else {
                    AccountStatus::Disabled
                },
                updated_at: v.update_at,
                ..Default::default()
            };

            // Find group memberships
            let mut member_of = Vec::new();
            for (group_name, group) in groups_map.iter() {
                if group.members.contains(&k.to_string()) {
                    member_of.push(group_name.clone());
                }
            }
            if !member_of.is_empty() {
                u.member_of = Some(member_of);
            }

            ret.insert(k.clone(), u);
        }

        Ok(ret)
    }

    async fn policy_notification_handler(&self, policy: &str) -> Result<()> {
        // Policy notification handler - no cache operations needed
        // Data will be queried directly from database when needed
        let mut m = HashMap::new();
        if let Err(err) = PolicyRepository::load_policy_doc(&self.pool, policy, &mut m).await {
            // Convert sqlx::Error to Error
            let converted_err = Error::other(format!("{}", err));
            if !is_err_no_such_policy(&converted_err) {
                return Err(converted_err);
            }
            // Policy not found - nothing to do
        }

        Ok(())
    }
}

