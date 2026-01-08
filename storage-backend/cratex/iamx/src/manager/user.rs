// User-related methods for IamSys

use crate::error::{Error, Result};
use crate::repository::{UserIdentityRepository, MappedPolicyRepository};
use crate::types::UserType;
use nebulafx_madmin::{AccountStatus, AddOrUpdateUserReq};
use nebulafx_policy::auth::{Credentials, UserIdentity};
use std::collections::HashMap;
use time::OffsetDateTime;

pub(crate) trait IamSysUserExt {
    async fn get_user(&self, access_key: &str) -> Option<UserIdentity>;
    async fn list_temp_accounts(&self, access_key: &str) -> Result<Vec<UserIdentity>>;
    async fn list_sts_accounts(&self, access_key: &str) -> Result<Vec<Credentials>>;
    async fn list_service_accounts(&self, access_key: &str) -> Result<Vec<Credentials>>;
    async fn add_service_account(&self, cred: Credentials) -> Result<OffsetDateTime>;
    async fn update_service_account(&self, name: &str, opts: crate::sys::UpdateServiceAccountOpts) -> Result<OffsetDateTime>;
    async fn set_temp_user(&self, access_key: &str, cred: &Credentials, policy_name: Option<&str>) -> Result<OffsetDateTime>;
    async fn get_user_info(&self, name: &str) -> Result<nebulafx_madmin::UserInfo>;
    async fn get_users(&self) -> Result<HashMap<String, nebulafx_madmin::UserInfo>>;
    async fn add_user(&self, access_key: &str, args: &AddOrUpdateUserReq) -> Result<OffsetDateTime>;
    async fn delete_user(&self, access_key: &str, utype: UserType) -> Result<()>;
    async fn update_user_secret_key(&self, access_key: &str, secret_key: &str) -> Result<()>;
    async fn set_user_status(&self, access_key: &str, status: AccountStatus) -> Result<OffsetDateTime>;
    async fn user_notification_handler(&self, name: &str, user_type: UserType) -> Result<()>;
}

impl IamSysUserExt for crate::sys::IamSys {
    async fn get_user(&self, access_key: &str) -> Option<UserIdentity> {
        // Try Reg user first
        let mut users_map = HashMap::new();
        if UserIdentityRepository::load_user(&self.pool, access_key, UserType::Reg, &mut users_map)
            .await
            .is_ok()
        {
            if let Some(user) = users_map.get(access_key) {
                return Some(user.clone());
            }
        }

        // Try Sts user
        let mut sts_users_map = HashMap::new();
        if UserIdentityRepository::load_user(&self.pool, access_key, UserType::Sts, &mut sts_users_map)
            .await
            .is_ok()
        {
            if let Some(user) = sts_users_map.get(access_key) {
                return Some(user.clone());
            }
        }

        // Try Svc user
        let mut svc_users_map = HashMap::new();
        if UserIdentityRepository::load_user(&self.pool, access_key, UserType::Svc, &mut svc_users_map)
            .await
            .is_ok()
        {
            if let Some(user) = svc_users_map.get(access_key) {
                return Some(user.clone());
            }
        }

        None
    }

    async fn list_temp_accounts(&self, access_key: &str) -> Result<Vec<UserIdentity>> {
        // Check if parent user exists
        let mut parent_users = HashMap::new();
        UserIdentityRepository::load_user(&self.pool, access_key, UserType::Reg, &mut parent_users)
            .await
            .map_err(|e| Error::other(format!("Failed to load parent user: {}", e)))?;
        
        if !parent_users.contains_key(access_key) {
            return Err(Error::NoSuchUser(access_key.to_string()));
        }

        // Load all STS users with this parent
        let mut all_sts_users = HashMap::new();
        UserIdentityRepository::load_users(&self.pool, UserType::Sts, &mut all_sts_users)
            .await
            .map_err(|e| Error::other(format!("Failed to load STS users: {}", e)))?;

        let mut ret = Vec::new();
        for (_, v) in all_sts_users.iter() {
            if v.credentials.parent_user == access_key && v.credentials.is_temp() {
                let mut u = v.clone();
                u.credentials.secret_key = String::new();
                u.credentials.session_token = String::new();
                ret.push(u);
            }
        }

        Ok(ret)
    }

    async fn list_sts_accounts(&self, access_key: &str) -> Result<Vec<Credentials>> {
        let mut all_sts_users = HashMap::new();
        UserIdentityRepository::load_users(&self.pool, UserType::Sts, &mut all_sts_users)
            .await
            .map_err(|e| Error::other(format!("Failed to load STS users: {}", e)))?;

        Ok(all_sts_users
            .values()
            .filter_map(|x| {
                if !access_key.is_empty() && x.credentials.parent_user.as_str() == access_key && x.credentials.is_temp() {
                    let mut c = x.credentials.clone();
                    c.secret_key = String::new();
                    c.session_token = String::new();
                    return Some(c);
                }
                None
            })
            .collect())
    }

    async fn list_service_accounts(&self, access_key: &str) -> Result<Vec<Credentials>> {
        let mut all_svc_users = HashMap::new();
        UserIdentityRepository::load_users(&self.pool, UserType::Svc, &mut all_svc_users)
            .await
            .map_err(|e| Error::other(format!("Failed to load service account users: {}", e)))?;

        Ok(all_svc_users
            .values()
            .filter_map(|x| {
                if !access_key.is_empty()
                    && x.credentials.parent_user.as_str() == access_key
                    && x.credentials.is_service_account()
                {
                    let mut c = x.credentials.clone();
                    c.secret_key = String::new();
                    c.session_token = String::new();
                    return Some(c);
                }
                None
            })
            .collect())
    }

    /// Create a service account
    async fn add_service_account(&self, cred: Credentials) -> Result<OffsetDateTime> {
        if cred.access_key.is_empty() || cred.parent_user.is_empty() {
            return Err(Error::InvalidArgument);
        }

        // Check if service account already exists
        let mut existing_users = HashMap::new();
        if UserIdentityRepository::load_user(&self.pool, &cred.access_key, UserType::Svc, &mut existing_users)
            .await
            .is_ok()
        {
            if existing_users.contains_key(&cred.access_key) {
                return Err(Error::IAMActionNotAllowed);
            }
        }

        let u = UserIdentity::new(cred);

        UserIdentityRepository::save(&self.pool, &u.credentials.access_key, UserType::Svc, &u, None).await
            .map_err(|e| Error::other(format!("Failed to save user identity: {}", e)))?;

        Ok(OffsetDateTime::now_utc())
    }

    async fn update_service_account(&self, name: &str, opts: crate::sys::UpdateServiceAccountOpts) -> Result<OffsetDateTime> {
        use crate::sys::{
            MAX_SVCSESSION_POLICY_SIZE, SESSION_POLICY_NAME, SESSION_POLICY_NAME_EXTRACTED,
        };
        use nebulafx_policy::{
            auth::{self, is_secret_key_valid, jwt_sign},
            policy::{EMBEDDED_POLICY_TYPE, INHERITED_POLICY_TYPE, iam_policy_claim_name_sa},
        };
        use serde_json::Value;
        use std::collections::HashMap;
        use crate::sys::get_claims_from_token_with_secret;
        use base64_simd;

        let mut users_map = HashMap::new();
        UserIdentityRepository::load_user(&self.pool, name, UserType::Svc, &mut users_map)
            .await
            .map_err(|e| Error::other(format!("Failed to load service account: {}", e)))?;
        
        let Some(ui) = users_map.get(name).cloned() else {
            return Err(Error::NoSuchServiceAccount(name.to_string()));
        };

        if !ui.credentials.is_service_account() {
            return Err(Error::NoSuchServiceAccount(name.to_string()));
        }

        let mut cr = ui.credentials.clone();
        let current_secret_key = cr.secret_key.clone();

        if let Some(secret) = opts.secret_key {
            if !is_secret_key_valid(&secret) {
                return Err(Error::InvalidSecretKeyLength);
            }
            cr.secret_key = secret;
        }

        if opts.name.is_some() {
            cr.name = opts.name;
        }

        if opts.description.is_some() {
            cr.description = opts.description;
        }

        if opts.expiration.is_some() {
            // TODO: check expiration
            cr.expiration = opts.expiration;
        }

        if let Some(status) = opts.status {
            match status.as_str() {
                val if val == AccountStatus::Enabled.as_ref() => cr.status = auth::ACCOUNT_ON.to_owned(),
                val if val == AccountStatus::Disabled.as_ref() => cr.status = auth::ACCOUNT_OFF.to_owned(),
                auth::ACCOUNT_ON => cr.status = auth::ACCOUNT_ON.to_owned(),
                auth::ACCOUNT_OFF => cr.status = auth::ACCOUNT_OFF.to_owned(),
                _ => cr.status = auth::ACCOUNT_OFF.to_owned(),
            }
        }

        let mut m: HashMap<String, Value> = get_claims_from_token_with_secret(&cr.session_token, &current_secret_key)?;
        m.remove(SESSION_POLICY_NAME_EXTRACTED);

        let nosp = if let Some(policy) = &opts.session_policy {
            policy.version.is_empty() && policy.statements.is_empty()
        } else {
            false
        };

        if m.contains_key(SESSION_POLICY_NAME) && nosp {
            m.remove(SESSION_POLICY_NAME);
            m.insert(iam_policy_claim_name_sa(), Value::String(INHERITED_POLICY_TYPE.to_owned()));
        }

        if let Some(session_policy) = &opts.session_policy {
            session_policy.validate()?;
            if !session_policy.version.is_empty() && !session_policy.statements.is_empty() {
                let policy_buf = serde_json::to_vec(&session_policy)?;
                if policy_buf.len() > MAX_SVCSESSION_POLICY_SIZE {
                    return Err(Error::PolicyTooLarge);
                }

                m.insert(
                    SESSION_POLICY_NAME.to_owned(),
                    Value::String(base64_simd::URL_SAFE_NO_PAD.encode_to_string(&policy_buf)),
                );
                m.insert(iam_policy_claim_name_sa(), Value::String(EMBEDDED_POLICY_TYPE.to_owned()));
            }
        }

        m.insert("accessKey".to_owned(), Value::String(name.to_owned()));

        cr.session_token = jwt_sign(&m, &cr.secret_key)?;

        let u = UserIdentity::new(cr);
        UserIdentityRepository::save(&self.pool, &u.credentials.access_key, UserType::Svc, &u, None).await
            .map_err(|e| Error::other(format!("Failed to save user identity: {}", e)))?;

        Ok(OffsetDateTime::now_utc())
    }

    async fn set_temp_user(&self, access_key: &str, cred: &Credentials, policy_name: Option<&str>) -> Result<OffsetDateTime> {
        use tracing::error;

        if access_key.is_empty() || !cred.is_temp() || cred.is_expired() || cred.parent_user.is_empty() {
            error!(
                "set temp user invalid argument, access_key: {},  is_temp: {}, is_expired: {}, parent_user_empty: {}",
                access_key,
                cred.is_temp(),
                cred.is_expired(),
                cred.parent_user.is_empty()
            );
            return Err(Error::InvalidArgument);
        }

        if let Some(policy) = policy_name {
            use crate::types::MappedPolicy;
            use crate::repository::PolicyRepository;
            let mp = MappedPolicy::new(policy);
            
            // Verify policy exists by loading it
            let mut policy_docs = HashMap::new();
            for p in mp.to_slice() {
                if !p.is_empty() {
                    PolicyRepository::load_policy_doc(&self.pool, &p, &mut policy_docs)
                        .await
                        .map_err(|e| Error::other(format!("Failed to load policy doc: {}", e)))?;
                }
            }
            
            if policy_docs.is_empty() {
                return Err(Error::other(format!("Required policy not found: {}", Error::NoSuchPolicy)));
            }

            MappedPolicyRepository::save(&self.pool, &cred.parent_user, UserType::Sts, false, &mp).await
                .map_err(|e| Error::other(format!("Failed to save mapped policy: {}", e)))?;
        }

        let u = UserIdentity::new(cred.clone());
        UserIdentityRepository::save(&self.pool, access_key, UserType::Sts, &u, None).await
            .map_err(|e| Error::other(format!("Failed to save user identity: {}", e)))?;

        Ok(OffsetDateTime::now_utc())
    }

    async fn get_user_info(&self, name: &str) -> Result<nebulafx_madmin::UserInfo> {
        use crate::repository::{MappedPolicyRepository, GroupRepository};
        
        // Load user
        let mut users_map = HashMap::new();
        UserIdentityRepository::load_user(&self.pool, name, UserType::Reg, &mut users_map)
            .await
            .map_err(|e| Error::other(format!("Failed to load user: {}", e)))?;
        
        let u = match users_map.get(name) {
            Some(u) => u,
            None => return Err(Error::NoSuchUser(name.to_string())),
        };

        if u.credentials.is_temp() || u.credentials.is_service_account() {
            return Err(Error::IAMActionNotAllowed);
        }

        let mut uinfo = nebulafx_madmin::UserInfo {
            status: if u.credentials.is_valid() {
                AccountStatus::Enabled
            } else {
                AccountStatus::Disabled
            },
            updated_at: u.update_at,
            ..Default::default()
        };

        // Load mapped policy
        let mut policy_map = HashMap::new();
        if MappedPolicyRepository::load_mapped_policy(&self.pool, name, UserType::Reg, false, &mut policy_map)
            .await
            .is_ok()
        {
            if let Some(p) = policy_map.get(name) {
                uinfo.policy_name = Some(p.policies.clone());
                uinfo.updated_at = Some(p.update_at);
            }
        }

        // Load group memberships
        let mut groups_map = HashMap::new();
        GroupRepository::load_groups(&self.pool, &mut groups_map)
            .await
            .map_err(|e| Error::other(format!("Failed to load groups: {}", e)))?;
        
        let mut member_of = Vec::new();
        for (group_name, group) in groups_map.iter() {
            if group.members.contains(&name.to_string()) {
                member_of.push(group_name.clone());
            }
        }
        if !member_of.is_empty() {
            uinfo.member_of = Some(member_of);
        }

        Ok(uinfo)
    }

    // Returns all users (not STS or service accounts)
    async fn get_users(&self) -> Result<std::collections::HashMap<String, nebulafx_madmin::UserInfo>> {
        use std::collections::HashMap;
        use crate::repository::{MappedPolicyRepository, GroupRepository};

        let mut m = HashMap::new();

        // Load all Reg users
        let mut users_map = HashMap::new();
        UserIdentityRepository::load_users(&self.pool, UserType::Reg, &mut users_map)
            .await
            .map_err(|e| Error::other(format!("Failed to load users: {}", e)))?;

        // Load all user policies
        let mut policies_map = HashMap::new();
        MappedPolicyRepository::load_mapped_policies(&self.pool, UserType::Reg, false, &mut policies_map)
            .await
            .map_err(|e| Error::other(format!("Failed to load user policies: {}", e)))?;

        // Load all groups
        let mut groups_map = HashMap::new();
        GroupRepository::load_groups(&self.pool, &mut groups_map)
            .await
            .map_err(|e| Error::other(format!("Failed to load groups: {}", e)))?;

        for (k, v) in users_map.iter() {
            if v.credentials.is_temp() || v.credentials.is_service_account() {
                continue;
            }

            let mut u = nebulafx_madmin::UserInfo {
                status: if v.credentials.is_valid() {
                    AccountStatus::Enabled
                } else {
                    AccountStatus::Disabled
                },
                updated_at: v.update_at,
                ..Default::default()
            };

            if let Some(p) = policies_map.get(k) {
                u.policy_name = Some(p.policies.clone());
                u.updated_at = Some(p.update_at);
            }

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

            m.insert(k.clone(), u);
        }

        Ok(m)
    }

    async fn add_user(&self, access_key: &str, args: &AddOrUpdateUserReq) -> Result<OffsetDateTime> {
        use nebulafx_policy::auth;
        use tracing::warn;

        // Check if user already exists
        let mut existing_users = HashMap::new();
        if UserIdentityRepository::load_user(&self.pool, access_key, UserType::Reg, &mut existing_users)
            .await
            .is_ok()
        {
            if let Some(x) = existing_users.get(access_key) {
                warn!("user already exists: {:?}", x);
                if x.credentials.is_temp() {
                    return Err(Error::IAMActionNotAllowed);
                }
            }
        }

        let status = {
            match &args.status {
                AccountStatus::Enabled => auth::ACCOUNT_ON,
                _ => auth::ACCOUNT_OFF,
            }
        };
        let user_entry = UserIdentity::from(Credentials {
            access_key: access_key.to_string(),
            secret_key: args.secret_key.to_string(),
            status: status.to_owned(),
            ..Default::default()
        });

        UserIdentityRepository::save(&self.pool, access_key, UserType::Reg, &user_entry, None).await
            .map_err(|e| Error::other(format!("Failed to save user identity: {}", e)))?;

        Ok(OffsetDateTime::now_utc())
    }

    async fn delete_user(&self, access_key: &str, utype: UserType) -> Result<()> {
        use super::group::IamSysGroupExt;
        use crate::repository::GroupRepository;
        
        if access_key.is_empty() {
            return Err(Error::InvalidArgument);
        }

        if utype == UserType::Reg {
            // Find groups this user belongs to
            let mut groups_map = HashMap::new();
            GroupRepository::load_groups(&self.pool, &mut groups_map)
                .await
                .map_err(|e| Error::other(format!("Failed to load groups: {}", e)))?;
            
            for (group_name, group) in groups_map.iter() {
                if group.members.contains(&access_key.to_string()) {
                    let _ = self
                        .remove_members_from_group(group_name, vec![access_key.to_string()], false)
                        .await?;
                }
            }

            // Find and delete all child accounts (service accounts and STS accounts)
            let mut all_svc_users = HashMap::new();
            UserIdentityRepository::load_users(&self.pool, UserType::Svc, &mut all_svc_users)
                .await
                .map_err(|e| Error::other(format!("Failed to load service accounts: {}", e)))?;
            
            for (_, v) in all_svc_users.iter() {
                let u = &v.credentials;
                if u.parent_user.as_str() == access_key {
                    let _ = UserIdentityRepository::delete(&self.pool, &u.access_key, UserType::Svc).await
                        .map_err(|e| Error::other(format!("Failed to delete service account: {}", e)));
                }
            }

            let mut all_sts_users = HashMap::new();
            UserIdentityRepository::load_users(&self.pool, UserType::Sts, &mut all_sts_users)
                .await
                .map_err(|e| Error::other(format!("Failed to load STS accounts: {}", e)))?;
            
            for (_, v) in all_sts_users.iter() {
                let u = &v.credentials;
                if u.parent_user.as_str() == access_key && u.is_temp() {
                    let _ = UserIdentityRepository::delete(&self.pool, &u.access_key, UserType::Sts).await
                        .map_err(|e| Error::other(format!("Failed to delete STS account: {}", e)));
                }
            }
        }

        // Delete mapped policy
        let _ = MappedPolicyRepository::delete(&self.pool, access_key, utype, false).await;

        // Delete user identity
        if let Err(err) = UserIdentityRepository::delete(&self.pool, access_key, utype).await {
            // sqlx::Error means database error, not "not found"
            return Err(Error::other(format!("Failed to delete user identity: {}", err)));
        }

        Ok(())
    }

    async fn update_user_secret_key(&self, access_key: &str, secret_key: &str) -> Result<()> {
        if access_key.is_empty() || secret_key.is_empty() {
            return Err(Error::InvalidArgument);
        }

        let mut users_map = HashMap::new();
        UserIdentityRepository::load_user(&self.pool, access_key, UserType::Reg, &mut users_map)
            .await
            .map_err(|e| Error::other(format!("Failed to load user: {}", e)))?;
        
        let u = match users_map.get(access_key) {
            Some(u) => u,
            None => return Err(Error::NoSuchUser(access_key.to_string())),
        };

        let mut cred = u.credentials.clone();
        cred.secret_key = secret_key.to_string();

        let u = UserIdentity::from(cred);

        UserIdentityRepository::save(&self.pool, access_key, UserType::Reg, &u, None).await
            .map_err(|e| Error::other(format!("Failed to save user identity: {}", e)))?;

        Ok(())
    }

    async fn set_user_status(&self, access_key: &str, status: AccountStatus) -> Result<OffsetDateTime> {
        use nebulafx_policy::auth;

        if access_key.is_empty() {
            return Err(Error::InvalidArgument);
        }

        if !access_key.is_empty() && status != AccountStatus::Enabled && status != AccountStatus::Disabled {
            return Err(Error::InvalidArgument);
        }

        let mut users_map = HashMap::new();
        UserIdentityRepository::load_user(&self.pool, access_key, UserType::Reg, &mut users_map)
            .await
            .map_err(|e| Error::other(format!("Failed to load user: {}", e)))?;
        
        let u = match users_map.get(access_key) {
            Some(u) => u,
            None => return Err(Error::NoSuchUser(access_key.to_string())),
        };

        if u.credentials.is_temp() || u.credentials.is_service_account() {
            return Err(Error::IAMActionNotAllowed);
        }

        let status = {
            match status {
                AccountStatus::Enabled => auth::ACCOUNT_ON,
                _ => auth::ACCOUNT_OFF,
            }
        };

        let user_entry = UserIdentity::from(Credentials {
            access_key: access_key.to_string(),
            secret_key: u.credentials.secret_key.clone(),
            status: status.to_owned(),
            ..Default::default()
        });

        UserIdentityRepository::save(&self.pool, access_key, UserType::Reg, &user_entry, None).await
            .map_err(|e| Error::other(format!("Failed to save user identity: {}", e)))?;

        Ok(OffsetDateTime::now_utc())
    }

    async fn user_notification_handler(&self, name: &str, user_type: UserType) -> Result<()> {
        use crate::error::is_err_no_such_user;
        use crate::repository::GroupRepository;
        use std::collections::HashMap;

        let mut m = HashMap::new();
        if let Err(err) = UserIdentityRepository::load_user(&self.pool, name, user_type, &mut m).await {
            // Convert sqlx::Error to Error
            let converted_err = Error::other(format!("{}", err));
            if !is_err_no_such_user(&converted_err) {
                return Err(converted_err);
            }

            // User not found - clean up related data
            // Find and remove from groups
            let mut groups_map = HashMap::new();
            if GroupRepository::load_groups(&self.pool, &mut groups_map).await.is_ok() {
                for (group_name, group) in groups_map.iter() {
                    if group.members.contains(&name.to_string()) {
                        use super::group::IamSysGroupExt;
                        if let Err(err) = self.remove_members_from_group(group_name, vec![name.to_string()], true).await {
                            use crate::error::is_err_no_such_group;
                            if !is_err_no_such_group(&err) {
                                return Err(err);
                            }
                        }
                    }
                }
            }

            // If deleting Reg user, also delete child accounts
            if user_type == UserType::Reg {
                // Delete service accounts
                let mut all_svc_users = HashMap::new();
                if UserIdentityRepository::load_users(&self.pool, UserType::Svc, &mut all_svc_users).await.is_ok() {
                    for (_, v) in all_svc_users.iter() {
                        let u = &v.credentials;
                        if u.parent_user.as_str() == name {
                            let _ = UserIdentityRepository::delete(&self.pool, &u.access_key, UserType::Svc).await
                                .map_err(|e| Error::other(format!("Failed to delete service account: {}", e)));
                        }
                    }
                }

                // Delete STS accounts
                let mut all_sts_users = HashMap::new();
                if UserIdentityRepository::load_users(&self.pool, UserType::Sts, &mut all_sts_users).await.is_ok() {
                    for (_, v) in all_sts_users.iter() {
                        let u = &v.credentials;
                        if u.parent_user.as_str() == name && u.is_temp() {
                            let _ = UserIdentityRepository::delete(&self.pool, &u.access_key, UserType::Sts).await
                                .map_err(|e| Error::other(format!("Failed to delete STS account: {}", e)));
                        }
                    }
                }
            }

            return Ok(());
        }

        // User exists - notification handler doesn't need to do anything
        // Data will be queried directly from database when needed
        Ok(())
    }
}

