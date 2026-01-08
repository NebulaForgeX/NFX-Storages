

use crate::error::Error as IamError;
use crate::error::is_err_no_such_account;
use crate::error::is_err_no_such_temp_account;
use crate::error::{Error, Result};
use sqlx::PgPool;
use crate::manager::utils::{extract_jwt_claims, get_default_policyes};
use crate::types::{GroupInfo, MappedPolicy, UserType};
use crate::utils::extract_claims;
use nebulafx_ecstore::global::get_global_action_cred;
use nebulafx_ecstore::notification_sys::get_global_notification_sys;
use nebulafx_madmin::AddOrUpdateUserReq;
use nebulafx_madmin::GroupDesc;
use nebulafx_policy::arn::ARN;
use nebulafx_policy::auth::Credentials;
use nebulafx_policy::auth::{
    ACCOUNT_ON, UserIdentity, contains_reserved_chars, create_new_credentials_with_metadata, generate_credentials,
    is_access_key_valid, is_secret_key_valid,
};
use nebulafx_policy::policy::Args;
use nebulafx_policy::policy::opa;
use nebulafx_policy::policy::{EMBEDDED_POLICY_TYPE, INHERITED_POLICY_TYPE, Policy, PolicyDoc, iam_policy_claim_name_sa};
use serde_json::Value;
use serde_json::json;
use std::collections::HashMap;
use std::sync::Arc;
use std::sync::OnceLock;
use time::OffsetDateTime;
use tokio::sync::RwLock;
use tracing::{error, info, warn};

pub const MAX_SVCSESSION_POLICY_SIZE: usize = 4096;

pub const STATUS_ENABLED: &str = "enabled";
pub const STATUS_DISABLED: &str = "disabled";

pub const POLICYNAME: &str = "policy";
pub const SESSION_POLICY_NAME: &str = "sessionPolicy";
pub const SESSION_POLICY_NAME_EXTRACTED: &str = "sessionPolicy-extracted";

static POLICY_PLUGIN_CLIENT: OnceLock<Arc<RwLock<Option<nebulafx_policy::policy::opa::AuthZPlugin>>>> = OnceLock::new();

fn get_policy_plugin_client() -> Arc<RwLock<Option<nebulafx_policy::policy::opa::AuthZPlugin>>> {
    POLICY_PLUGIN_CLIENT.get_or_init(|| Arc::new(RwLock::new(None))).clone()
}

pub struct IamSys {
    pub(crate) pool: PgPool,
    roles_map: HashMap<ARN, String>,
}

impl IamSys {
    pub fn new(pool: PgPool) -> Self {
        tokio::spawn(async move {
            match opa::lookup_config().await {
                Ok(conf) => {
                    if conf.enable() {
                        Self::set_policy_plugin_client(opa::AuthZPlugin::new(conf)).await;
                        info!("OPA plugin enabled");
                    }
                }
                Err(e) => {
                    error!("Error loading OPA configuration err:{}", e);
                }
            };
        });

        Self {
            pool,
            roles_map: HashMap::new(),
        }
    }
    pub fn has_watcher(&self) -> bool {
        // Database-based storage doesn't have watchers
        false
    }

    pub async fn set_policy_plugin_client(client: nebulafx_policy::policy::opa::AuthZPlugin) {
        let policy_plugin_client = get_policy_plugin_client();
        let mut guard = policy_plugin_client.write().await;
        *guard = Some(client);
    }

    pub async fn get_policy_plugin_client() -> Option<nebulafx_policy::policy::opa::AuthZPlugin> {
        let policy_plugin_client = get_policy_plugin_client();
        let guard = policy_plugin_client.read().await;
        guard.clone()
    }

    pub async fn load_group(&self, name: &str) -> Result<()> {
        use crate::manager::group::IamSysGroupExt;
        IamSysGroupExt::group_notification_handler(self, name).await
    }

    pub async fn load_groups(&self, m: &mut HashMap<String, GroupInfo>) -> Result<()> {
        use crate::repository::GroupRepository;
        GroupRepository::load_groups(&self.pool, m).await
            .map_err(|e| Error::other(format!("Failed to load groups: {}", e)))
    }

    pub async fn load_policy(&self, name: &str) -> Result<()> {
        use crate::manager::policy::IamSysPolicyExt;
        IamSysPolicyExt::policy_notification_handler(self, name).await
    }

    pub async fn load_policy_mapping(&self, name: &str, user_type: UserType, is_group: bool) -> Result<()> {
        use crate::manager::mapped_policy::IamSysMappedPolicyExt;
        IamSysMappedPolicyExt::policy_mapping_notification_handler(self, name, user_type, is_group).await
    }

    pub async fn load_user(&self, name: &str, user_type: UserType) -> Result<()> {
        use crate::manager::user::IamSysUserExt;
        IamSysUserExt::user_notification_handler(self, name, user_type).await
    }

    pub async fn load_users(&self, user_type: UserType, m: &mut HashMap<String, UserIdentity>) -> Result<()> {
        use crate::repository::UserIdentityRepository;
        UserIdentityRepository::load_users(&self.pool, user_type, m).await
            .map_err(|e| Error::other(format!("Failed to load users: {}", e)))
    }

    pub async fn load_service_account(&self, name: &str) -> Result<()> {
        use crate::manager::user::IamSysUserExt;
        IamSysUserExt::user_notification_handler(self, name, UserType::Svc).await
    }

    pub async fn delete_policy(&self, name: &str, notify: bool) -> Result<()> {
        for k in get_default_policyes().keys() {
            if k == name {
                return Err(Error::other("system policy can not be deleted"));
            }
        }

        use crate::manager::policy::IamSysPolicyExt;
        IamSysPolicyExt::delete_policy(self, name, notify).await?;

        if !notify || self.has_watcher() {
            return Ok(());
        }

        if let Some(notification_sys) = get_global_notification_sys() {
            let resp = notification_sys.delete_policy(name).await;
            for r in resp {
                if let Some(err) = r.err {
                    warn!("notify delete_policy failed: {}", err);
                }
            }
        }

        Ok(())
    }

    pub async fn info_policy(&self, name: &str) -> Result<nebulafx_madmin::PolicyInfo> {
        use crate::manager::policy::IamSysPolicyExt;
        let d = IamSysPolicyExt::get_policy_doc(self, name).await?;

        let pdata = serde_json::to_string(&d.policy)?;

        Ok(nebulafx_madmin::PolicyInfo {
            policy_name: name.to_string(),
            policy: json!(pdata),
            create_date: d.create_date,
            update_date: d.update_date,
        })
    }

    pub async fn load_mapped_policies(
        &self,
        user_type: UserType,
        is_group: bool,
        m: &mut HashMap<String, MappedPolicy>,
    ) -> Result<()> {
        use crate::repository::MappedPolicyRepository;
        MappedPolicyRepository::load_mapped_policies(&self.pool, user_type, is_group, m).await
            .map_err(|e| Error::other(format!("Failed to load mapped policies: {}", e)))
    }

    pub async fn list_polices(&self, bucket_name: &str) -> Result<HashMap<String, Policy>> {
        use crate::manager::policy::IamSysPolicyExt;
        IamSysPolicyExt::list_polices(self, bucket_name).await
    }

    pub async fn list_policy_docs(&self, bucket_name: &str) -> Result<HashMap<String, PolicyDoc>> {
        use crate::manager::policy::IamSysPolicyExt;
        IamSysPolicyExt::list_policy_docs(self, bucket_name).await
    }

    pub async fn set_policy(&self, name: &str, policy: Policy) -> Result<OffsetDateTime> {
        use crate::manager::policy::IamSysPolicyExt;
        let updated_at = IamSysPolicyExt::set_policy(self, name, policy).await?;

        if !self.has_watcher() {
            if let Some(notification_sys) = get_global_notification_sys() {
                let resp = notification_sys.load_policy(name).await;
                for r in resp {
                    if let Some(err) = r.err {
                        warn!("notify load_policy failed: {}", err);
                    }
                }
            }
        }

        Ok(updated_at)
    }

    pub async fn get_role_policy(&self, arn_str: &str) -> Result<(ARN, String)> {
        let Some(arn) = ARN::parse(arn_str).ok() else {
            return Err(Error::other("Invalid ARN"));
        };

        let Some(policy) = self.roles_map.get(&arn) else {
            return Err(Error::other("No such role"));
        };

        Ok((arn, policy.clone()))
    }

    pub async fn delete_user(&self, name: &str, notify: bool) -> Result<()> {
        use crate::manager::user::IamSysUserExt;
        IamSysUserExt::delete_user(self, name, UserType::Reg).await?;

        if notify && !self.has_watcher() {
            if let Some(notification_sys) = get_global_notification_sys() {
                let resp = notification_sys.delete_user(name).await;
                for r in resp {
                    if let Some(err) = r.err {
                        warn!("notify delete_user failed: {}", err);
                    }
                }
            }
        }

        Ok(())
    }

    async fn notify_for_user(&self, name: &str, is_temp: bool) {
        if self.has_watcher() {
            return;
        }

        if let Some(notification_sys) = get_global_notification_sys() {
            let resp = notification_sys.load_user(name, is_temp).await;
            for r in resp {
                if let Some(err) = r.err {
                    warn!("notify load_user failed: {}", err);
                }
            }
        }
    }

    async fn notify_for_service_account(&self, name: &str) {
        if self.has_watcher() {
            return;
        }

        if let Some(notification_sys) = get_global_notification_sys() {
            let resp = notification_sys.load_service_account(name).await;
            for r in resp {
                if let Some(err) = r.err {
                    warn!("notify load_service_account failed: {}", err);
                }
            }
        }
    }

    pub async fn current_policies(&self, name: &str) -> String {
        use crate::manager::policy::IamSysPolicyExt;
        IamSysPolicyExt::merge_policies(self, name).await.0
    }

    pub async fn list_bucket_users(&self, bucket_name: &str) -> Result<HashMap<String, nebulafx_madmin::UserInfo>> {
        use crate::manager::policy::IamSysPolicyExt;
        IamSysPolicyExt::get_bucket_users(self, bucket_name).await
    }

    pub async fn list_users(&self) -> Result<HashMap<String, nebulafx_madmin::UserInfo>> {
        use crate::manager::user::IamSysUserExt;
        IamSysUserExt::get_users(self).await
    }

    pub async fn set_temp_user(&self, name: &str, cred: &Credentials, policy_name: Option<&str>) -> Result<OffsetDateTime> {
        use crate::manager::user::IamSysUserExt;
        let updated_at = IamSysUserExt::set_temp_user(self, name, cred, policy_name).await?;

        self.notify_for_user(&cred.access_key, true).await;

        Ok(updated_at)
    }

    pub async fn is_temp_user(&self, name: &str) -> Result<(bool, String)> {
        use crate::manager::user::IamSysUserExt;
        let Some(u) = IamSysUserExt::get_user(self, name).await else {
            return Err(IamError::NoSuchUser(name.to_string()));
        };
        if u.credentials.is_temp() {
            Ok((true, u.credentials.parent_user))
        } else {
            Ok((false, "".to_string()))
        }
    }
    pub async fn is_service_account(&self, name: &str) -> Result<(bool, String)> {
        use crate::manager::user::IamSysUserExt;
        let Some(u) = IamSysUserExt::get_user(self, name).await else {
            return Err(IamError::NoSuchUser(name.to_string()));
        };

        if u.credentials.is_service_account() {
            Ok((true, u.credentials.parent_user))
        } else {
            Ok((false, "".to_string()))
        }
    }

    pub async fn get_user_info(&self, name: &str) -> Result<nebulafx_madmin::UserInfo> {
        use crate::manager::user::IamSysUserExt;
        IamSysUserExt::get_user_info(self, name).await
    }

    pub async fn set_user_status(&self, name: &str, status: nebulafx_madmin::AccountStatus) -> Result<OffsetDateTime> {
        use crate::manager::user::IamSysUserExt;
        let updated_at = IamSysUserExt::set_user_status(self, name, status).await?;

        self.notify_for_user(name, false).await;

        Ok(updated_at)
    }

    pub async fn new_service_account(
        &self,
        parent_user: &str,
        groups: Option<Vec<String>>,
        opts: NewServiceAccountOpts,
    ) -> Result<(Credentials, OffsetDateTime)> {
        if parent_user.is_empty() {
            return Err(IamError::InvalidArgument);
        }
        if !opts.access_key.is_empty() && opts.secret_key.is_empty() {
            return Err(IamError::NoSecretKeyWithAccessKey);
        }

        if !opts.secret_key.is_empty() && opts.access_key.is_empty() {
            return Err(IamError::NoAccessKeyWithSecretKey);
        }

        if parent_user == opts.access_key {
            return Err(IamError::IAMActionNotAllowed);
        }

        if opts.expiration.is_none() {
            return Err(IamError::InvalidExpiration);
        }

        // TODO: check allow_site_replicator_account

        let policy_buf = if let Some(policy) = opts.session_policy {
            policy.validate()?;
            let buf = serde_json::to_vec(&policy)?;
            if buf.len() > MAX_SVCSESSION_POLICY_SIZE {
                return Err(IamError::PolicyTooLarge);
            }

            buf
        } else {
            Vec::new()
        };

        let mut m: HashMap<String, Value> = HashMap::new();
        m.insert("parent".to_owned(), Value::String(parent_user.to_owned()));

        if !policy_buf.is_empty() {
            m.insert(
                SESSION_POLICY_NAME.to_owned(),
                Value::String(base64_simd::URL_SAFE_NO_PAD.encode_to_string(&policy_buf)),
            );
            m.insert(iam_policy_claim_name_sa(), Value::String(EMBEDDED_POLICY_TYPE.to_owned()));
        } else {
            m.insert(iam_policy_claim_name_sa(), Value::String(INHERITED_POLICY_TYPE.to_owned()));
        }

        if let Some(claims) = opts.claims {
            for (k, v) in claims.iter() {
                if !m.contains_key(k) {
                    m.insert(k.to_owned(), v.to_owned());
                }
            }
        }

        // set expiration time default to 1 hour
        m.insert(
            "exp".to_string(),
            Value::Number(serde_json::Number::from(
                opts.expiration
                    .map_or(OffsetDateTime::now_utc().unix_timestamp() + 3600, |t| t.unix_timestamp()),
            )),
        );

        let (access_key, secret_key) = if !opts.access_key.is_empty() || !opts.secret_key.is_empty() {
            (opts.access_key, opts.secret_key)
        } else {
            generate_credentials()?
        };

        let mut cred = create_new_credentials_with_metadata(&access_key, &secret_key, &m, &secret_key)?;
        cred.parent_user = parent_user.to_owned();
        cred.groups = groups;
        cred.status = ACCOUNT_ON.to_owned();
        cred.name = opts.name;
        cred.description = opts.description;
        cred.expiration = opts.expiration;

        use crate::manager::user::IamSysUserExt;
        let create_at = self.add_service_account(cred.clone()).await?;

        self.notify_for_service_account(&cred.access_key).await;

        Ok((cred, create_at))
    }

    pub async fn update_service_account(&self, name: &str, opts: UpdateServiceAccountOpts) -> Result<OffsetDateTime> {
        use crate::manager::user::IamSysUserExt;
        let updated_at = IamSysUserExt::update_service_account(self, name, opts).await?;

        self.notify_for_service_account(name).await;

        Ok(updated_at)
    }

    pub async fn list_service_accounts(&self, access_key: &str) -> Result<Vec<Credentials>> {
        use crate::manager::user::IamSysUserExt;
        IamSysUserExt::list_service_accounts(self, access_key).await
    }

    pub async fn list_temp_accounts(&self, access_key: &str) -> Result<Vec<UserIdentity>> {
        use crate::manager::user::IamSysUserExt;
        IamSysUserExt::list_temp_accounts(self, access_key).await
    }

    pub async fn list_sts_accounts(&self, access_key: &str) -> Result<Vec<Credentials>> {
        use crate::manager::user::IamSysUserExt;
        IamSysUserExt::list_sts_accounts(self, access_key).await
    }

    pub async fn get_service_account(&self, access_key: &str) -> Result<(Credentials, Option<Policy>)> {
        let (mut da, policy) = self.get_service_account_internal(access_key).await?;

        da.credentials.secret_key.clear();
        da.credentials.session_token.clear();

        Ok((da.credentials, policy))
    }

    async fn get_service_account_internal(&self, access_key: &str) -> Result<(UserIdentity, Option<Policy>)> {
        let (sa, claims) = match self.get_account_with_claims(access_key).await {
            Ok(res) => res,
            Err(err) => {
                if is_err_no_such_account(&err) {
                    return Err(IamError::NoSuchServiceAccount(access_key.to_string()));
                }

                return Err(err);
            }
        };

        if !sa.credentials.is_service_account() {
            return Err(IamError::NoSuchServiceAccount(access_key.to_string()));
        }

        let op_pt = claims.get(&iam_policy_claim_name_sa());
        let op_sp = claims.get(SESSION_POLICY_NAME);
        if let (Some(pt), Some(sp)) = (op_pt, op_sp) {
            if pt == EMBEDDED_POLICY_TYPE {
                let policy = serde_json::from_slice(
                    &base64_simd::URL_SAFE_NO_PAD.decode_to_vec(sp.as_str().unwrap_or_default().as_bytes())?,
                )?;
                return Ok((sa, Some(policy)));
            }
        }

        Ok((sa, None))
    }

    async fn get_account_with_claims(&self, access_key: &str) -> Result<(UserIdentity, HashMap<String, Value>)> {
        let Some(acc) = self.get_user(access_key).await else {
            return Err(IamError::NoSuchAccount(access_key.to_string()));
        };

        let m = extract_jwt_claims(&acc)?;

        Ok((acc, m))
    }

    pub async fn get_temporary_account(&self, access_key: &str) -> Result<(Credentials, Option<Policy>)> {
        let (mut sa, policy) = match self.get_temp_account(access_key).await {
            Ok(res) => res,
            Err(err) => {
                if is_err_no_such_temp_account(&err) {
                    // TODO: load_user
                    match self.get_temp_account(access_key).await {
                        Ok(res) => res,
                        Err(err) => return Err(err),
                    };
                }

                return Err(err);
            }
        };
        sa.credentials.secret_key.clear();
        sa.credentials.session_token.clear();

        Ok((sa.credentials, policy))
    }

    async fn get_temp_account(&self, access_key: &str) -> Result<(UserIdentity, Option<Policy>)> {
        let (sa, claims) = match self.get_account_with_claims(access_key).await {
            Ok(res) => res,
            Err(err) => {
                if is_err_no_such_account(&err) {
                    return Err(IamError::NoSuchTempAccount(access_key.to_string()));
                }

                return Err(err);
            }
        };

        if !sa.credentials.is_temp() {
            return Err(IamError::NoSuchTempAccount(access_key.to_string()));
        }

        let op_pt = claims.get(&iam_policy_claim_name_sa());
        let op_sp = claims.get(SESSION_POLICY_NAME);
        if let (Some(pt), Some(sp)) = (op_pt, op_sp) {
            if pt == EMBEDDED_POLICY_TYPE {
                let policy = serde_json::from_slice(
                    &base64_simd::URL_SAFE_NO_PAD.decode_to_vec(sp.as_str().unwrap_or_default().as_bytes())?,
                )?;
                return Ok((sa, Some(policy)));
            }
        }

        Ok((sa, None))
    }

    pub async fn get_claims_for_svc_acc(&self, access_key: &str) -> Result<HashMap<String, Value>> {
        use crate::manager::user::IamSysUserExt;
        let Some(u) = IamSysUserExt::get_user(self, access_key).await else {
            return Err(IamError::NoSuchServiceAccount(access_key.to_string()));
        };

        if !u.credentials.is_service_account() {
            return Err(IamError::NoSuchServiceAccount(access_key.to_string()));
        }

        extract_jwt_claims(&u)
    }

    pub async fn delete_service_account(&self, access_key: &str, notify: bool) -> Result<()> {
        use crate::manager::user::IamSysUserExt;
        let Some(u) = IamSysUserExt::get_user(self, access_key).await else {
            return Ok(());
        };

        if !u.credentials.is_service_account() {
            return Ok(());
        }

        IamSysUserExt::delete_user(self, access_key, UserType::Svc).await?;

        if notify && !self.has_watcher() {
            if let Some(notification_sys) = get_global_notification_sys() {
                let resp = notification_sys.delete_service_account(access_key).await;
                for r in resp {
                    if let Some(err) = r.err {
                        warn!("notify delete_service_account failed: {}", err);
                    }
                }
            }
        }

        Ok(())
    }

    async fn notify_for_group(&self, group: &str) {
        if self.has_watcher() {
            return;
        }

        if let Some(notification_sys) = get_global_notification_sys() {
            let resp = notification_sys.load_group(group).await;
            for r in resp {
                if let Some(err) = r.err {
                    warn!("notify load_group failed: {}", err);
                }
            }
        }
    }

    pub async fn create_user(&self, access_key: &str, args: &AddOrUpdateUserReq) -> Result<OffsetDateTime> {
        if !is_access_key_valid(access_key) {
            return Err(IamError::InvalidAccessKeyLength);
        }

        if contains_reserved_chars(access_key) {
            return Err(IamError::ContainsReservedChars);
        }

        if !is_secret_key_valid(&args.secret_key) {
            return Err(IamError::InvalidSecretKeyLength);
        }

        use crate::manager::user::IamSysUserExt;
        let updated_at = IamSysUserExt::add_user(self, access_key, args).await?;

        self.notify_for_user(access_key, false).await;

        Ok(updated_at)
    }

    pub async fn set_user_secret_key(&self, access_key: &str, secret_key: &str) -> Result<()> {
        if !is_access_key_valid(access_key) {
            return Err(IamError::InvalidAccessKeyLength);
        }

        if !is_secret_key_valid(secret_key) {
            return Err(IamError::InvalidSecretKeyLength);
        }

        use crate::manager::user::IamSysUserExt;
        IamSysUserExt::update_user_secret_key(self, access_key, secret_key).await
    }

    pub async fn check_key(&self, access_key: &str) -> Result<(Option<UserIdentity>, bool)> {
        if let Some(sys_cred) = get_global_action_cred() {
            if sys_cred.access_key == access_key {
                return Ok((Some(UserIdentity::new(sys_cred)), true));
            }
        }

        // First, try to get user from users table (database)
        use crate::repository::UserRepository;
        if let Ok(Some(user_entity)) = UserRepository::find_by_access_key(&self.pool, access_key).await {
            // User found in users table - create UserIdentity from it
            use nebulafx_policy::auth::Credentials;
            let cred = Credentials {
                access_key: user_entity.access_key.clone(),
                secret_key: user_entity.secret_key.clone(),
                status: ACCOUNT_ON.to_string(), // Default to enabled, can be overridden by user_identities
                ..Default::default()
            };

            // Try to get additional info from user_identities table
            use crate::repository::UserIdentityRepository;
            use crate::types::UserType;
            
            // Determine user type from user_entity.user_type
            let user_type = match user_entity.user_type.as_str() {
                "root" | "Reg" => UserType::Reg,
                "Sts" => UserType::Sts,
                "Svc" => UserType::Svc,
                _ => UserType::Reg,
            };

            let user_identity = if let Ok(Some(mut identity)) = UserIdentityRepository::find(&self.pool, access_key, user_type).await {
                // Merge: use secret_key from users table, but keep other info from user_identities
                identity.credentials.secret_key = user_entity.secret_key.clone();
                identity.credentials.access_key = user_entity.access_key.clone();
                identity
            } else {
                // No user_identity found, create from users table
                UserIdentity::new(cred)
            };

            let ok = user_identity.credentials.is_valid();
            return Ok((Some(user_identity), ok));
        }

        // Fallback: try user_identities table (for backward compatibility)
        use crate::manager::user::IamSysUserExt;
        match IamSysUserExt::get_user(self, access_key).await {
            Some(res) => {
                let ok = res.credentials.is_valid();
                Ok((Some(res), ok))
            }
            None => Ok((None, false)),
        }
    }

    pub async fn get_user(&self, access_key: &str) -> Option<UserIdentity> {
        match self.check_key(access_key).await {
            Ok((u, _)) => u,
            _ => None,
        }
    }

    pub async fn add_users_to_group(&self, group: &str, users: Vec<String>) -> Result<OffsetDateTime> {
        if contains_reserved_chars(group) {
            return Err(IamError::GroupNameContainsReservedChars);
        }
        use crate::manager::group::IamSysGroupExt;
        let updated_at = IamSysGroupExt::add_users_to_group(self, group, users).await?;

        self.notify_for_group(group).await;

        Ok(updated_at)
    }

    pub async fn remove_users_from_group(&self, group: &str, users: Vec<String>) -> Result<OffsetDateTime> {
        use crate::manager::group::IamSysGroupExt;
        let updated_at = IamSysGroupExt::remove_users_from_group(self, group, users).await?;

        self.notify_for_group(group).await;

        Ok(updated_at)
    }

    pub async fn set_group_status(&self, group: &str, enable: bool) -> Result<OffsetDateTime> {
        use crate::manager::group::IamSysGroupExt;
        let updated_at = IamSysGroupExt::set_group_status(self, group, enable).await?;

        self.notify_for_group(group).await;

        Ok(updated_at)
    }
    pub async fn get_group_description(&self, group: &str) -> Result<GroupDesc> {
        use crate::manager::group::IamSysGroupExt;
        IamSysGroupExt::get_group_description(self, group).await
    }

    pub async fn list_groups_load(&self) -> Result<Vec<String>> {
        use crate::manager::group::IamSysGroupExt;
        IamSysGroupExt::update_groups(self).await
    }

    pub async fn list_groups(&self) -> Result<Vec<String>> {
        use crate::manager::group::IamSysGroupExt;
        IamSysGroupExt::list_groups(self).await
    }

    pub async fn policy_db_set(&self, name: &str, user_type: UserType, is_group: bool, policy: &str) -> Result<OffsetDateTime> {
        use crate::manager::mapped_policy::IamSysMappedPolicyExt;
        let updated_at = IamSysMappedPolicyExt::policy_db_set(self, name, user_type, is_group, policy).await?;

        if !self.has_watcher() {
            if let Some(notification_sys) = get_global_notification_sys() {
                let resp = notification_sys.load_policy_mapping(name, user_type.to_u64(), is_group).await;
                for r in resp {
                    if let Some(err) = r.err {
                        warn!("notify load_policy failed: {}", err);
                    }
                }
            }
        }

        Ok(updated_at)
    }

    pub async fn policy_db_get(&self, name: &str, groups: &Option<Vec<String>>) -> Result<Vec<String>> {
        use crate::manager::mapped_policy::IamSysMappedPolicyExt;
        IamSysMappedPolicyExt::policy_db_get(self, name, groups).await
    }

    pub async fn is_allowed_sts(&self, args: &Args<'_>, parent_user: &str) -> bool {
        let is_owner = parent_user == get_global_action_cred().unwrap().access_key;
        let role_arn = args.get_role_arn();
        let policies = {
            if is_owner {
                Vec::new()
            } else if role_arn.is_some() {
                let Ok(arn) = ARN::parse(role_arn.unwrap_or_default()) else { return false };

                MappedPolicy::new(self.roles_map.get(&arn).map_or_else(String::default, |v| v.clone()).as_str()).to_slice()
            } else {
                use crate::manager::mapped_policy::IamSysMappedPolicyExt;
        let Ok(p) = IamSysMappedPolicyExt::policy_db_get(self, parent_user, args.groups).await else { return false };

                p
                //TODO: FROM JWT
            }
        };

        if !is_owner && policies.is_empty() {
            return false;
        }

        let combined_policy = {
            if is_owner {
                Policy::default()
            } else {
                use crate::manager::policy::IamSysPolicyExt;
                let (a, c) = IamSysPolicyExt::merge_policies(self, &policies.join(",")).await;
                if a.is_empty() {
                    return false;
                }
                c
            }
        };

        let (has_session_policy, is_allowed_sp) = is_allowed_by_session_policy(args);
        if has_session_policy {
            return is_allowed_sp && (is_owner || combined_policy.is_allowed(args));
        }

        is_owner || combined_policy.is_allowed(args)
    }

    pub async fn is_allowed_service_account(&self, args: &Args<'_>, parent_user: &str) -> bool {
        let Some(p) = args.claims.get("parent") else {
            return false;
        };

        if p.as_str() != Some(parent_user) {
            return false;
        }

        let is_owner = parent_user == get_global_action_cred().unwrap().access_key;

        let role_arn = args.get_role_arn();

        let svc_policies = {
            if is_owner {
                Vec::new()
            } else if role_arn.is_some() {
                let Ok(arn) = ARN::parse(role_arn.unwrap_or_default()) else { return false };
                MappedPolicy::new(self.roles_map.get(&arn).map_or_else(String::default, |v| v.clone()).as_str()).to_slice()
            } else {
                use crate::manager::mapped_policy::IamSysMappedPolicyExt;
        let Ok(p) = IamSysMappedPolicyExt::policy_db_get(self, parent_user, args.groups).await else { return false };
                p
            }
        };

        if !is_owner && svc_policies.is_empty() {
            return false;
        }

        let combined_policy = {
            if is_owner {
                Policy::default()
            } else {
                use crate::manager::policy::IamSysPolicyExt;
                let (a, c) = IamSysPolicyExt::merge_policies(self, &svc_policies.join(",")).await;
                if a.is_empty() {
                    return false;
                }
                c
            }
        };

        let mut parent_args = args.clone();
        parent_args.account = parent_user;

        let Some(sa) = args.claims.get(&iam_policy_claim_name_sa()) else {
            return false;
        };

        let Some(sa_str) = sa.as_str() else {
            return false;
        };

        if sa_str == INHERITED_POLICY_TYPE {
            return is_owner || combined_policy.is_allowed(&parent_args);
        }

        let (has_session_policy, is_allowed_sp) = is_allowed_by_session_policy_for_service_account(args);
        if has_session_policy {
            return is_allowed_sp && (is_owner || combined_policy.is_allowed(&parent_args));
        }

        is_owner || combined_policy.is_allowed(&parent_args)
    }

    pub async fn get_combined_policy(&self, policies: &[String]) -> Policy {
        use crate::manager::policy::IamSysPolicyExt;
        IamSysPolicyExt::merge_policies(self, &policies.join(",")).await.1
    }

    pub async fn is_allowed(&self, args: &Args<'_>) -> bool {
        if args.is_owner {
            return true;
        }

        let opa_enable = Self::get_policy_plugin_client().await;
        if let Some(opa_enable) = opa_enable {
            return opa_enable.is_allowed(args).await;
        }

        let Ok((is_temp, parent_user)) = self.is_temp_user(args.account).await else { return false };

        if is_temp {
            return self.is_allowed_sts(args, &parent_user).await;
        }

        let Ok((is_svc, parent_user)) = self.is_service_account(args.account).await else { return false };

        if is_svc {
            return self.is_allowed_service_account(args, &parent_user).await;
        }

        use crate::manager::mapped_policy::IamSysMappedPolicyExt;
        let Ok(policies) = IamSysMappedPolicyExt::policy_db_get(self, args.account, args.groups).await else { return false };

        if policies.is_empty() {
            return false;
        }

        self.get_combined_policy(&policies).await.is_allowed(args)
    }
}

fn is_allowed_by_session_policy(args: &Args<'_>) -> (bool, bool) {
    let Some(policy) = args.claims.get(SESSION_POLICY_NAME_EXTRACTED) else {
        return (false, false);
    };

    let has_session_policy = true;

    let Some(policy_str) = policy.as_str() else {
        return (has_session_policy, false);
    };

    let Ok(sub_policy) = Policy::parse_config(policy_str.as_bytes()) else {
        return (has_session_policy, false);
    };

    if sub_policy.version.is_empty() {
        return (has_session_policy, false);
    }

    let mut session_policy_args = args.clone();
    session_policy_args.is_owner = false;

    (has_session_policy, sub_policy.is_allowed(&session_policy_args))
}

fn is_allowed_by_session_policy_for_service_account(args: &Args<'_>) -> (bool, bool) {
    let Some(policy) = args.claims.get(SESSION_POLICY_NAME_EXTRACTED) else {
        return (false, false);
    };

    let mut has_session_policy = true;

    let Some(policy_str) = policy.as_str() else {
        return (has_session_policy, false);
    };

    let Ok(sub_policy) = Policy::parse_config(policy_str.as_bytes()) else {
        return (has_session_policy, false);
    };

    if sub_policy.version.is_empty() && sub_policy.statements.is_empty() && sub_policy.id.is_empty() {
        has_session_policy = false;
        return (has_session_policy, false);
    }

    let mut session_policy_args = args.clone();
    session_policy_args.is_owner = false;

    (has_session_policy, sub_policy.is_allowed(&session_policy_args))
}

#[derive(Debug, Clone, Default)]
pub struct NewServiceAccountOpts {
    pub session_policy: Option<Policy>,
    pub access_key: String,
    pub secret_key: String,
    pub name: Option<String>,
    pub description: Option<String>,
    pub expiration: Option<OffsetDateTime>,
    pub allow_site_replicator_account: bool,
    pub claims: Option<HashMap<String, Value>>,
}

pub struct UpdateServiceAccountOpts {
    pub session_policy: Option<Policy>,
    pub secret_key: Option<String>,
    pub name: Option<String>,
    pub description: Option<String>,
    pub expiration: Option<OffsetDateTime>,
    pub status: Option<String>,
}

pub fn get_claims_from_token_with_secret(token: &str, secret: &str) -> Result<HashMap<String, Value>> {
    let mut ms =
        extract_claims::<HashMap<String, Value>>(token, secret).map_err(|e| Error::other(format!("extract claims err {e}")))?;

    if let Some(session_policy) = ms.claims.get(SESSION_POLICY_NAME) {
        let policy_str = session_policy.as_str().unwrap_or_default();
        let policy = base64_simd::URL_SAFE_NO_PAD
            .decode_to_vec(policy_str.as_bytes())
            .map_err(|e| Error::other(format!("base64 decode err {e}")))?;
        ms.claims.insert(
            SESSION_POLICY_NAME_EXTRACTED.to_string(),
            Value::String(String::from_utf8(policy).map_err(|e| Error::other(format!("utf8 decode err {e}")))?),
        );
    }
    Ok(ms.claims)
}
