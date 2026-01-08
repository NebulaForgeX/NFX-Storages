// Group-related methods for IamSys

use crate::error::{Error, Result, is_err_no_such_group};
use crate::repository::{GroupRepository, MappedPolicyRepository, UserIdentityRepository};
use crate::types::{GroupInfo, UserType};
use crate::sys::STATUS_DISABLED;
use nebulafx_madmin::GroupDesc;
use std::collections::{HashMap, HashSet};
use time::OffsetDateTime;

pub(crate) trait IamSysGroupExt {
    async fn add_users_to_group(&self, group: &str, members: Vec<String>) -> Result<OffsetDateTime>;
    async fn set_group_status(&self, name: &str, enable: bool) -> Result<OffsetDateTime>;
    async fn get_group_description(&self, name: &str) -> Result<GroupDesc>;
    async fn list_groups(&self) -> Result<Vec<String>>;
    async fn update_groups(&self) -> Result<Vec<String>>;
    async fn remove_users_from_group(&self, group: &str, members: Vec<String>) -> Result<OffsetDateTime>;
    async fn group_notification_handler(&self, group: &str) -> Result<()>;
    async fn remove_members_from_group(&self, name: &str, members: Vec<String>, update_cache_only: bool) -> Result<OffsetDateTime>;
}

impl IamSysGroupExt for crate::sys::IamSys {
    async fn remove_members_from_group(&self, name: &str, members: Vec<String>, update_cache_only: bool) -> Result<OffsetDateTime> {
        // Load group from database
        let mut groups_map = HashMap::new();
            GroupRepository::load_group(&self.pool, name, &mut groups_map)
            .await
            .map_err(|e| Error::other(format!("Failed to load group: {}", e)))?;
        
        let mut gi = groups_map.get(name)
            .cloned()
            .ok_or(Error::NoSuchGroup(name.to_string()))?;

        let s: HashSet<&String> = HashSet::from_iter(gi.members.iter());
        let d: HashSet<&String> = HashSet::from_iter(members.iter());
        gi.members = s.difference(&d).map(|v| v.to_string()).collect::<Vec<String>>();

        if !update_cache_only {
            GroupRepository::save(&self.pool, name, &gi).await
            .map_err(|e| Error::other(format!("Failed to save group info: {}", e)))?;
        }

        Ok(OffsetDateTime::now_utc())
    }
    
    async fn add_users_to_group(&self, group: &str, members: Vec<String>) -> Result<OffsetDateTime> {
        if group.is_empty() {
            return Err(Error::InvalidArgument);
        }

        // Verify all members exist and are valid
        for member in members.iter() {
            let mut users_map = HashMap::new();
            UserIdentityRepository::load_user(&self.pool, member, UserType::Reg, &mut users_map)
                .await
                .map_err(|e| Error::other(format!("Failed to load user: {}", e)))?;
            
            if let Some(u) = users_map.get(member) {
                if u.credentials.is_temp() || u.credentials.is_service_account() {
                    return Err(Error::IAMActionNotAllowed);
                }
            } else {
                return Err(Error::NoSuchUser(member.to_string()));
            }
        }

        // Load existing group or create new
        let mut groups_map = HashMap::new();
        let gi = if GroupRepository::load_group(&self.pool, group, &mut groups_map)
            .await
            .is_ok()
        {
            if let Some(existing) = groups_map.get(group) {
                let mut gi = existing.clone();
                let mut uniq_set: HashSet<String, std::collections::hash_map::RandomState> =
                    HashSet::from_iter(gi.members.iter().cloned());
                uniq_set.extend(members.iter().cloned());

                gi.members = uniq_set.into_iter().collect();
                gi
            } else {
                GroupInfo::new(members.clone())
            }
        } else {
            GroupInfo::new(members.clone())
        };

        GroupRepository::save(&self.pool, group, &gi).await
            .map_err(|e| Error::other(format!("Failed to save group info: {}", e)))?;

        Ok(OffsetDateTime::now_utc())
    }

    async fn set_group_status(&self, name: &str, enable: bool) -> Result<OffsetDateTime> {
        use crate::sys::STATUS_ENABLED;

        if name.is_empty() {
            return Err(Error::InvalidArgument);
        }

        // Load group from database
        let mut groups_map = HashMap::new();
            GroupRepository::load_group(&self.pool, name, &mut groups_map)
            .await
            .map_err(|e| Error::other(format!("Failed to load group: {}", e)))?;
        
        let mut gi = groups_map.get(name)
            .cloned()
            .ok_or(Error::NoSuchGroup(name.to_string()))?;

        if enable {
            gi.status = STATUS_ENABLED.to_owned();
        } else {
            gi.status = STATUS_DISABLED.to_owned();
        }

        GroupRepository::save(&self.pool, name, &gi).await
            .map_err(|e| Error::other(format!("Failed to save group info: {}", e)))?;

        Ok(OffsetDateTime::now_utc())
    }

    async fn get_group_description(&self, name: &str) -> Result<GroupDesc> {
        use super::mapped_policy::IamSysMappedPolicyExt;
        let (ps, updated_at) = self.policy_db_get_internal(name, true, false).await?;
        let policy = ps.join(",");

        // Load group from database
        let mut groups_map = HashMap::new();
            GroupRepository::load_group(&self.pool, name, &mut groups_map)
            .await
            .map_err(|e| Error::other(format!("Failed to load group: {}", e)))?;
        
        let gi = groups_map.get(name)
            .cloned()
            .ok_or(Error::NoSuchGroup(name.to_string()))?;

        Ok(GroupDesc {
            name: name.to_string(),
            policy,
            members: gi.members,
            updated_at: Some(updated_at),
            status: gi.status,
        })
    }

    async fn list_groups(&self) -> Result<Vec<String>> {
        let mut groups_map = HashMap::new();
        GroupRepository::load_groups(&self.pool, &mut groups_map)
            .await
            .map_err(|e| Error::other(format!("Failed to load groups: {}", e)))?;
        
        Ok(groups_map.keys().cloned().collect())
    }

    async fn update_groups(&self) -> Result<Vec<String>> {
        let mut groups_set = HashSet::new();
        
        // Load all groups
        let mut m = HashMap::new();
        GroupRepository::load_groups(&self.pool, &mut m).await
            .map_err(|e| Error::other(format!("Failed to load groups: {}", e)))?;
        for group in m.keys() {
            groups_set.insert(group.clone());
        }

        // Load all group policies
        let mut m = HashMap::new();
        MappedPolicyRepository::load_mapped_policies(&self.pool, UserType::Reg, true, &mut m).await
            .map_err(|e| Error::other(format!("Failed to load mapped policies: {}", e)))?;
        for group in m.keys() {
            groups_set.insert(group.clone());
        }

        Ok(groups_set.into_iter().collect())
    }

    async fn remove_users_from_group(&self, group: &str, members: Vec<String>) -> Result<OffsetDateTime> {
        if group.is_empty() {
            return Err(Error::InvalidArgument);
        }

        // Verify all members exist and are valid
        for member in members.iter() {
            let mut users_map = HashMap::new();
            UserIdentityRepository::load_user(&self.pool, member, UserType::Reg, &mut users_map)
                .await
                .map_err(|e| Error::other(format!("Failed to load user: {}", e)))?;
            
            if let Some(u) = users_map.get(member) {
                if u.credentials.is_temp() || u.credentials.is_service_account() {
                    return Err(Error::IAMActionNotAllowed);
                }
            } else {
                return Err(Error::NoSuchUser(member.to_string()));
            }
        }

        // Load group from database
        let mut groups_map = HashMap::new();
            GroupRepository::load_group(&self.pool, group, &mut groups_map)
            .await
            .map_err(|e| Error::other(format!("Failed to load group: {}", e)))?;
        
        let gi = groups_map.get(group)
            .cloned()
            .ok_or(Error::NoSuchGroup(group.to_string()))?;

        if members.is_empty() && !gi.members.is_empty() {
            return Err(Error::GroupNotEmpty);
        }

        if members.is_empty() {
            // Delete group
            if let Err(err) = MappedPolicyRepository::delete(&self.pool, group, UserType::Reg, true).await {
                // sqlx::Error means database error, not "not found"
                return Err(Error::other(format!("Failed to delete mapped policy: {}", err)));
            }

            if let Err(err) = GroupRepository::delete(&self.pool, group).await {
                // Convert sqlx::Error to Error
                let converted_err = Error::other(format!("{}", err));
                if !is_err_no_such_group(&converted_err) {
                    return Err(converted_err);
                }
            }

            return Ok(OffsetDateTime::now_utc());
        }

        self.remove_members_from_group(group, members, false).await
    }

    async fn group_notification_handler(&self, group: &str) -> Result<()> {
        // Group notification handler - no cache operations needed
        // Data will be queried directly from database when needed
        let mut m = HashMap::new();
        if let Err(err) = GroupRepository::load_group(&self.pool, group, &mut m).await {
            // Convert sqlx::Error to Error
            let converted_err = Error::other(format!("{}", err));
            if !is_err_no_such_group(&converted_err) {
                return Err(converted_err);
            }
            // Group not found - nothing to do
        }

        Ok(())
    }
}

