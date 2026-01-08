use crate::{
    admin::{auth::validate_admin_request, router::Operation, utils::has_space_be},
    auth::{check_key_valid, get_session_token},
};
use http::{HeaderMap, StatusCode};
use matchit::Params;
use nebulafx_ecstore::global::get_global_action_cred;
use nebulafx_iamx::{GroupInfo, MappedPolicy, UserType, sys::NewServiceAccountOpts};
use nebulafx_madmin::{
    AddOrUpdateUserReq, IAMEntities, IAMErrEntities, IAMErrEntity, IAMErrPolicyEntity,
    user::{ImportIAMResult, SRSvcAccCreate},
};
use nebulafx_policy::policy::action::{Action, AdminAction};
use nebulafx_utils::path::path_join_buf;
use s3s::{
    Body, S3Error, S3ErrorCode, S3Request, S3Response, S3Result,
    header::CONTENT_TYPE,
    s3_error,
};
use std::collections::HashMap;
use std::io::{Cursor, Read as _};
use tracing::warn;
use zip::{ZipArchive, result::ZipError};

use super::common::{
    ALL_GROUPS_FILE, ALL_POLICIES_FILE, ALL_SVC_ACCTS_FILE, ALL_USERS_FILE,
    GROUP_POLICY_MAPPINGS_FILE, IAM_ASSETS_DIR, STS_USER_POLICY_MAPPINGS_FILE,
    USER_POLICY_MAPPINGS_FILE,
};

pub struct ImportIam {}

#[async_trait::async_trait]
impl Operation for ImportIam {
    async fn call(&self, req: S3Request<Body>, _params: Params<'_, '_>) -> S3Result<S3Response<(StatusCode, Body)>> {
        let Some(input_cred) = req.credentials else {
            return Err(s3_error!(InvalidRequest, "get cred failed"));
        };

        let (cred, owner) =
            check_key_valid(get_session_token(&req.uri, &req.headers).unwrap_or_default(), &input_cred.access_key).await?;

        validate_admin_request(&req.headers, &cred, owner, false, vec![Action::AdminAction(AdminAction::ExportIAMAction)])
            .await?;

        let mut input = req.input;
        let body = match input.store_all_unlimited().await {
            Ok(b) => b,
            Err(e) => {
                warn!("get body failed, e: {:?}", e);
                return Err(s3_error!(InvalidRequest, "get body failed"));
            }
        };

        let mut zip_reader =
            ZipArchive::new(Cursor::new(body)).map_err(|e| S3Error::with_message(S3ErrorCode::InternalError, e.to_string()))?;

        let Ok(iam_store) = nebulafx_iamx::get() else {
            return Err(s3_error!(InvalidRequest, "iam not init"));
        };

        let skipped = IAMEntities::default();
        let mut removed = IAMEntities::default();
        let mut added = IAMEntities::default();
        let mut failed = IAMErrEntities::default();

        // Import policies
        {
            let file_path = path_join_buf(&[IAM_ASSETS_DIR, ALL_POLICIES_FILE]);
            let file_content = match zip_reader.by_name(file_path.as_str()) {
                Err(ZipError::FileNotFound) => None,
                Err(_) => return Err(s3_error!(InvalidRequest, "get file failed")),
                Ok(file) => {
                    let mut file = file;
                    let mut file_content = Vec::new();
                    file.read_to_end(&mut file_content)
                        .map_err(|e| S3Error::with_message(S3ErrorCode::InternalError, e.to_string()))?;
                    Some(file_content)
                }
            };

            if let Some(file_content) = file_content {
                let policies: HashMap<String, nebulafx_policy::policy::Policy> = serde_json::from_slice(&file_content)
                    .map_err(|e| S3Error::with_message(S3ErrorCode::InternalError, e.to_string()))?;
                for (name, policy) in policies {
                    if policy.is_empty() {
                        let res = iam_store.delete_policy(&name, true).await;
                        removed.policies.push(name.clone());
                        if let Err(e) = res {
                            return Err(s3_error!(InternalError, "delete policy failed, name: {name}, err: {e}"));
                        }
                        continue;
                    }

                    let res = iam_store.set_policy(&name, policy).await;
                    added.policies.push(name.clone());
                    if let Err(e) = res {
                        return Err(s3_error!(InternalError, "set policy failed, name: {name}, err: {e}"));
                    }
                }
            }
        }

        let Some(sys_cred) = get_global_action_cred() else {
            return Err(s3_error!(InvalidRequest, "get sys cred failed"));
        };

        // Import users
        {
            let file_path = path_join_buf(&[IAM_ASSETS_DIR, ALL_USERS_FILE]);
            let file_content = match zip_reader.by_name(file_path.as_str()) {
                Err(ZipError::FileNotFound) => None,
                Err(_) => return Err(s3_error!(InvalidRequest, "get file failed")),
                Ok(file) => {
                    let mut file = file;
                    let mut file_content = Vec::new();
                    file.read_to_end(&mut file_content)
                        .map_err(|e| S3Error::with_message(S3ErrorCode::InternalError, e.to_string()))?;
                    Some(file_content)
                }
            };

            if let Some(file_content) = file_content {
                let users: HashMap<String, AddOrUpdateUserReq> = serde_json::from_slice(&file_content)
                    .map_err(|e| S3Error::with_message(S3ErrorCode::InternalError, e.to_string()))?;
                for (ak, req) in users {
                    if ak == sys_cred.access_key {
                        return Err(s3_error!(InvalidArgument, "can't create user with system access key"));
                    }

                    if let Some(u) = iam_store.get_user(&ak).await {
                        if u.credentials.is_temp() || u.credentials.is_service_account() {
                            return Err(s3_error!(InvalidArgument, "can't create user with system access key"));
                        }
                    } else if has_space_be(&ak) {
                        return Err(s3_error!(InvalidArgument, "has space be"));
                    }

                    if let Err(e) = iam_store.create_user(&ak, &req).await {
                        failed.users.push(IAMErrEntity {
                            name: ak.clone(),
                            error: e.to_string(),
                        });
                    } else {
                        added.users.push(ak.clone());
                    }
                }
            }
        }

        // Import groups
        {
            let file_path = path_join_buf(&[IAM_ASSETS_DIR, ALL_GROUPS_FILE]);
            let file_content = match zip_reader.by_name(file_path.as_str()) {
                Err(ZipError::FileNotFound) => None,
                Err(_) => return Err(s3_error!(InvalidRequest, "get file failed")),
                Ok(file) => {
                    let mut file = file;
                    let mut file_content = Vec::new();
                    file.read_to_end(&mut file_content)
                        .map_err(|e| S3Error::with_message(S3ErrorCode::InternalError, e.to_string()))?;
                    Some(file_content)
                }
            };

            if let Some(file_content) = file_content {
                let groups: HashMap<String, GroupInfo> = serde_json::from_slice(&file_content)
                    .map_err(|e| S3Error::with_message(S3ErrorCode::InternalError, e.to_string()))?;
                for (group_name, group_info) in groups {
                    if let Err(e) = iam_store.get_group_description(&group_name).await {
                        if matches!(e, nebulafx_iamx::error::Error::NoSuchGroup(_)) || has_space_be(&group_name) {
                            return Err(s3_error!(InvalidArgument, "group not found or has space be"));
                        }
                    }

                    if let Err(e) = iam_store.add_users_to_group(&group_name, group_info.members.clone()).await {
                        failed.groups.push(IAMErrEntity {
                            name: group_name.clone(),
                            error: e.to_string(),
                        });
                    } else {
                        added.groups.push(group_name.clone());
                    }
                }
            }
        }

        // Import service accounts
        {
            let file_path = path_join_buf(&[IAM_ASSETS_DIR, ALL_SVC_ACCTS_FILE]);
            let file_content = match zip_reader.by_name(file_path.as_str()) {
                Err(ZipError::FileNotFound) => None,
                Err(_) => return Err(s3_error!(InvalidRequest, "get file failed")),
                Ok(file) => {
                    let mut file = file;
                    let mut file_content = Vec::new();
                    file.read_to_end(&mut file_content)
                        .map_err(|e| S3Error::with_message(S3ErrorCode::InternalError, e.to_string()))?;
                    Some(file_content)
                }
            };

            if let Some(file_content) = file_content {
                let svc_accts: HashMap<String, SRSvcAccCreate> = serde_json::from_slice(&file_content)
                    .map_err(|e| S3Error::with_message(S3ErrorCode::InternalError, e.to_string()))?;
                for (ak, req) in svc_accts {
                    if skipped.service_accounts.contains(&ak) {
                        continue;
                    }

                    let sp = if let Some(ps) = req.session_policy.as_str() {
                        let sp = nebulafx_policy::policy::Policy::parse_config(ps.as_bytes())
                            .map_err(|e| S3Error::with_message(S3ErrorCode::InternalError, e.to_string()))?;
                        Some(sp)
                    } else {
                        None
                    };

                    if has_space_be(&ak) {
                        return Err(s3_error!(InvalidArgument, "has space be {ak}"));
                    }

                    let mut update = true;

                    if let Err(e) = iam_store.get_service_account(&req.access_key).await {
                        if !matches!(e, nebulafx_iamx::error::Error::NoSuchServiceAccount(_)) {
                            return Err(s3_error!(InvalidArgument, "failed to get service account {ak} {e}"));
                        }
                        update = false;
                    }

                    if update {
                        iam_store.delete_service_account(&req.access_key, true).await.map_err(|e| {
                            S3Error::with_message(
                                S3ErrorCode::InternalError,
                                format!("failed to delete service account {ak} {e}"),
                            )
                        })?;
                    }

                    let opts = NewServiceAccountOpts {
                        session_policy: sp,
                        access_key: ak.clone(),
                        secret_key: req.secret_key,
                        name: Some(req.name),
                        description: Some(req.description),
                        expiration: req.expiration,
                        allow_site_replicator_account: false,
                        claims: Some(req.claims),
                    };

                    let groups = if req.groups.is_empty() { None } else { Some(req.groups) };

                    if let Err(e) = iam_store.new_service_account(&req.parent, groups, opts).await {
                        failed.service_accounts.push(IAMErrEntity {
                            name: ak.clone(),
                            error: e.to_string(),
                        });
                    } else {
                        added.service_accounts.push(ak.clone());
                    }
                }
            }
        }

        // Import user policy mappings
        {
            let file_path = path_join_buf(&[IAM_ASSETS_DIR, USER_POLICY_MAPPINGS_FILE]);
            let file_content = match zip_reader.by_name(file_path.as_str()) {
                Err(ZipError::FileNotFound) => None,
                Err(_) => return Err(s3_error!(InvalidRequest, "get file failed")),
                Ok(file) => {
                    let mut file = file;
                    let mut file_content = Vec::new();
                    file.read_to_end(&mut file_content)
                        .map_err(|e| S3Error::with_message(S3ErrorCode::InternalError, e.to_string()))?;
                    Some(file_content)
                }
            };

            if let Some(file_content) = file_content {
                let user_policy_mappings: HashMap<String, MappedPolicy> = serde_json::from_slice(&file_content)
                    .map_err(|e| S3Error::with_message(S3ErrorCode::InternalError, e.to_string()))?;
                for (user_name, policies) in user_policy_mappings {
                    let has_temp = match iam_store.is_temp_user(&user_name).await {
                        Ok((has_temp, _)) => has_temp,
                        Err(e) => {
                            if !matches!(e, nebulafx_iamx::error::Error::NoSuchUser(_)) {
                                return Err(s3_error!(InternalError, "is temp user failed, name: {user_name}, err: {e}"));
                            }
                            false
                        }
                    };

                    if has_temp {
                        return Err(s3_error!(InvalidArgument, "can't set policy for temp user {user_name}"));
                    }

                    if let Err(e) = iam_store
                        .policy_db_set(&user_name, UserType::Reg, false, &policies.policies)
                        .await
                    {
                        failed.user_policies.push(IAMErrPolicyEntity {
                            name: user_name.clone(),
                            error: e.to_string(),
                            policies: policies.policies.split(',').map(|s| s.to_string()).collect(),
                        });
                    } else {
                        added.user_policies.push(HashMap::from([(
                            user_name.clone(),
                            policies.policies.split(',').map(|s| s.to_string()).collect(),
                        )]));
                    }
                }
            }
        }

        // Import group policy mappings
        {
            let file_path = path_join_buf(&[IAM_ASSETS_DIR, GROUP_POLICY_MAPPINGS_FILE]);
            let file_content = match zip_reader.by_name(file_path.as_str()) {
                Err(ZipError::FileNotFound) => None,
                Err(_) => return Err(s3_error!(InvalidRequest, "get file failed")),
                Ok(file) => {
                    let mut file = file;
                    let mut file_content = Vec::new();
                    file.read_to_end(&mut file_content)
                        .map_err(|e| S3Error::with_message(S3ErrorCode::InternalError, e.to_string()))?;
                    Some(file_content)
                }
            };

            if let Some(file_content) = file_content {
                let group_policy_mappings: HashMap<String, MappedPolicy> = serde_json::from_slice(&file_content)
                    .map_err(|e| S3Error::with_message(S3ErrorCode::InternalError, e.to_string()))?;
                for (group_name, policies) in group_policy_mappings {
                    if skipped.groups.contains(&group_name) {
                        continue;
                    }

                    if let Err(e) = iam_store
                        .policy_db_set(&group_name, UserType::None, true, &policies.policies)
                        .await
                    {
                        failed.group_policies.push(IAMErrPolicyEntity {
                            name: group_name.clone(),
                            error: e.to_string(),
                            policies: policies.policies.split(',').map(|s| s.to_string()).collect(),
                        });
                    } else {
                        added.group_policies.push(HashMap::from([(
                            group_name.clone(),
                            policies.policies.split(',').map(|s| s.to_string()).collect(),
                        )]));
                    }
                }
            }
        }

        // Import STS user policy mappings
        {
            let file_path = path_join_buf(&[IAM_ASSETS_DIR, STS_USER_POLICY_MAPPINGS_FILE]);
            let file_content = match zip_reader.by_name(file_path.as_str()) {
                Err(ZipError::FileNotFound) => None,
                Err(_) => return Err(s3_error!(InvalidRequest, "get file failed")),
                Ok(file) => {
                    let mut file = file;
                    let mut file_content = Vec::new();
                    file.read_to_end(&mut file_content)
                        .map_err(|e| S3Error::with_message(S3ErrorCode::InternalError, e.to_string()))?;
                    Some(file_content)
                }
            };

            if let Some(file_content) = file_content {
                let sts_user_policy_mappings: HashMap<String, MappedPolicy> = serde_json::from_slice(&file_content)
                    .map_err(|e| S3Error::with_message(S3ErrorCode::InternalError, e.to_string()))?;
                for (user_name, policies) in sts_user_policy_mappings {
                    if skipped.users.contains(&user_name) {
                        continue;
                    }

                    let has_temp = match iam_store.is_temp_user(&user_name).await {
                        Ok((has_temp, _)) => has_temp,
                        Err(e) => {
                            if !matches!(e, nebulafx_iamx::error::Error::NoSuchUser(_)) {
                                return Err(s3_error!(InternalError, "is temp user failed, name: {user_name}, err: {e}"));
                            }
                            false
                        }
                    };

                    if has_temp {
                        return Err(s3_error!(InvalidArgument, "can't set policy for temp user {user_name}"));
                    }

                    if let Err(e) = iam_store
                        .policy_db_set(&user_name, UserType::Sts, false, &policies.policies)
                        .await
                    {
                        failed.sts_policies.push(IAMErrPolicyEntity {
                            name: user_name.clone(),
                            error: e.to_string(),
                            policies: policies.policies.split(',').map(|s| s.to_string()).collect(),
                        });
                    } else {
                        added.sts_policies.push(HashMap::from([(
                            user_name.clone(),
                            policies.policies.split(',').map(|s| s.to_string()).collect(),
                        )]));
                    }
                }
            }
        }

        let ret = ImportIAMResult {
            skipped,
            removed,
            added,
            failed,
        };

        let body = serde_json::to_vec(&ret).map_err(|e| S3Error::with_message(S3ErrorCode::InternalError, e.to_string()))?;

        let mut header = HeaderMap::new();
        header.insert(CONTENT_TYPE, "application/json".parse().unwrap());

        Ok(S3Response::with_headers((StatusCode::OK, Body::from(body)), header))
    }
}

