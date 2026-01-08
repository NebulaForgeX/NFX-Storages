use crate::{
    admin::{auth::validate_admin_request, router::Operation},
    auth::{check_key_valid, get_session_token},
};
use http::{HeaderMap, StatusCode};
use matchit::Params;
use nebulafx_iamx::{GroupInfo, MappedPolicy, UserType};
use nebulafx_madmin::{AccountStatus, AddOrUpdateUserReq};
use nebulafx_madmin::user::{SRSessionPolicy, SRSvcAccCreate};
use nebulafx_policy::policy::action::{Action, AdminAction};
use nebulafx_utils::path::path_join_buf;
use s3s::{
    Body, S3Error, S3ErrorCode, S3Request, S3Response, S3Result,
    header::{CONTENT_DISPOSITION, CONTENT_LENGTH, CONTENT_TYPE},
    s3_error,
};
use std::collections::HashMap;
use std::io::{Cursor, Write};
use zip::{ZipWriter, write::SimpleFileOptions};

use super::common::{
    ALL_GROUPS_FILE, ALL_POLICIES_FILE, ALL_SVC_ACCTS_FILE, ALL_USERS_FILE,
    GROUP_POLICY_MAPPINGS_FILE, IAM_ASSETS_DIR, IAM_EXPORT_FILES,
    STS_USER_POLICY_MAPPINGS_FILE, USER_POLICY_MAPPINGS_FILE,
};

pub struct ExportIam {}

#[async_trait::async_trait]
impl Operation for ExportIam {
    async fn call(&self, req: S3Request<Body>, _params: Params<'_, '_>) -> S3Result<S3Response<(StatusCode, Body)>> {
        let Some(input_cred) = req.credentials else {
            return Err(s3_error!(InvalidRequest, "get cred failed"));
        };

        let (cred, owner) =
            check_key_valid(get_session_token(&req.uri, &req.headers).unwrap_or_default(), &input_cred.access_key).await?;

        validate_admin_request(&req.headers, &cred, owner, false, vec![Action::AdminAction(AdminAction::ExportIAMAction)])
            .await?;

        let Ok(iam_store) = nebulafx_iamx::get() else {
            return Err(s3_error!(InvalidRequest, "iam not init"));
        };

        let mut zip_writer = ZipWriter::new(Cursor::new(Vec::new()));
        let options = SimpleFileOptions::default();

        for &file in IAM_EXPORT_FILES {
            let file_path = path_join_buf(&[IAM_ASSETS_DIR, file]);
            match file {
                ALL_POLICIES_FILE => {
                    let policies: HashMap<String, nebulafx_policy::policy::Policy> = iam_store
                        .list_polices("")
                        .await
                        .map_err(|e| S3Error::with_message(S3ErrorCode::InternalError, e.to_string()))?;
                    let json_str = serde_json::to_vec(&policies)
                        .map_err(|e| S3Error::with_message(S3ErrorCode::InternalError, e.to_string()))?;
                    zip_writer
                        .start_file(file_path, options)
                        .map_err(|e| S3Error::with_message(S3ErrorCode::InternalError, e.to_string()))?;
                    zip_writer
                        .write_all(&json_str)
                        .map_err(|e| S3Error::with_message(S3ErrorCode::InternalError, e.to_string()))?;
                }
                ALL_USERS_FILE => {
                    let mut users = HashMap::new();
                    iam_store
                        .load_users(UserType::Reg, &mut users)
                        .await
                        .map_err(|e| S3Error::with_message(S3ErrorCode::InternalError, e.to_string()))?;

                    let users: HashMap<String, AddOrUpdateUserReq> = users
                        .into_iter()
                        .map(|(k, v)| {
                            (
                                k,
                                AddOrUpdateUserReq {
                                    secret_key: v.credentials.secret_key,
                                    status: {
                                        if v.credentials.status == "off" {
                                            AccountStatus::Disabled
                                        } else {
                                            AccountStatus::Enabled
                                        }
                                    },
                                    policy: None,
                                },
                            )
                        })
                        .collect::<HashMap<String, AddOrUpdateUserReq>>();

                    let json_str = serde_json::to_vec(&users)
                        .map_err(|e| S3Error::with_message(S3ErrorCode::InternalError, e.to_string()))?;
                    zip_writer
                        .start_file(file_path, options)
                        .map_err(|e| S3Error::with_message(S3ErrorCode::InternalError, e.to_string()))?;
                    zip_writer
                        .write_all(&json_str)
                        .map_err(|e| S3Error::with_message(S3ErrorCode::InternalError, e.to_string()))?;
                }
                ALL_GROUPS_FILE => {
                    let mut groups: HashMap<String, GroupInfo> = HashMap::new();
                    iam_store
                        .load_groups(&mut groups)
                        .await
                        .map_err(|e| S3Error::with_message(S3ErrorCode::InternalError, e.to_string()))?;

                    let json_str = serde_json::to_vec(&groups)
                        .map_err(|e| S3Error::with_message(S3ErrorCode::InternalError, e.to_string()))?;
                    zip_writer
                        .start_file(file_path, options)
                        .map_err(|e| S3Error::with_message(S3ErrorCode::InternalError, e.to_string()))?;
                    zip_writer
                        .write_all(&json_str)
                        .map_err(|e| S3Error::with_message(S3ErrorCode::InternalError, e.to_string()))?;
                }
                ALL_SVC_ACCTS_FILE => {
                    let mut service_accounts = HashMap::new();
                    iam_store
                        .load_users(UserType::Svc, &mut service_accounts)
                        .await
                        .map_err(|e| S3Error::with_message(S3ErrorCode::InternalError, e.to_string()))?;

                    let mut svc_accts: HashMap<String, SRSvcAccCreate> = HashMap::new();
                    for (k, acc) in service_accounts {
                        if k == "siteReplicatorSvcAcc" {
                            continue;
                        }

                        let claims = iam_store
                            .get_claims_for_svc_acc(&acc.credentials.access_key)
                            .await
                            .map_err(|e| S3Error::with_message(S3ErrorCode::InternalError, e.to_string()))?;

                        let (sa, police) = iam_store
                            .get_service_account(&acc.credentials.access_key)
                            .await
                            .map_err(|e| S3Error::with_message(S3ErrorCode::InternalError, e.to_string()))?;

                        let police_json = if let Some(police) = police {
                            serde_json::to_string(&police)
                                .map_err(|e| S3Error::with_message(S3ErrorCode::InternalError, e.to_string()))?
                        } else {
                            "null".to_string()
                        };

                        let svc_acc_create_req = SRSvcAccCreate {
                            parent: acc.credentials.parent_user,
                            access_key: k.clone(),
                            secret_key: acc.credentials.secret_key,
                            groups: acc.credentials.groups.unwrap_or_default(),
                            claims,
                            session_policy: SRSessionPolicy::from_json(&police_json).unwrap_or_default(),
                            status: acc.credentials.status,
                            name: sa.name.unwrap_or_default(),
                            description: sa.description.unwrap_or_default(),
                            expiration: sa.expiration,
                            api_version: None,
                        };
                        svc_accts.insert(k.clone(), svc_acc_create_req);
                    }

                    let json_str = serde_json::to_vec(&svc_accts)
                        .map_err(|e| S3Error::with_message(S3ErrorCode::InternalError, e.to_string()))?;
                    zip_writer
                        .start_file(file_path, options)
                        .map_err(|e| S3Error::with_message(S3ErrorCode::InternalError, e.to_string()))?;
                    zip_writer
                        .write_all(&json_str)
                        .map_err(|e| S3Error::with_message(S3ErrorCode::InternalError, e.to_string()))?;
                }
                USER_POLICY_MAPPINGS_FILE => {
                    let mut user_policy_mappings: HashMap<String, MappedPolicy> = HashMap::new();
                    iam_store
                        .load_mapped_policies(UserType::Reg, false, &mut user_policy_mappings)
                        .await
                        .map_err(|e| S3Error::with_message(S3ErrorCode::InternalError, e.to_string()))?;

                    let json_str = serde_json::to_vec(&user_policy_mappings)
                        .map_err(|e| S3Error::with_message(S3ErrorCode::InternalError, e.to_string()))?;
                    zip_writer
                        .start_file(file_path, options)
                        .map_err(|e| S3Error::with_message(S3ErrorCode::InternalError, e.to_string()))?;
                    zip_writer
                        .write_all(&json_str)
                        .map_err(|e| S3Error::with_message(S3ErrorCode::InternalError, e.to_string()))?;
                }
                GROUP_POLICY_MAPPINGS_FILE => {
                    let mut group_policy_mappings = HashMap::new();
                    iam_store
                        .load_mapped_policies(UserType::Reg, true, &mut group_policy_mappings)
                        .await
                        .map_err(|e| S3Error::with_message(S3ErrorCode::InternalError, e.to_string()))?;

                    let json_str = serde_json::to_vec(&group_policy_mappings)
                        .map_err(|e| S3Error::with_message(S3ErrorCode::InternalError, e.to_string()))?;
                    zip_writer
                        .start_file(file_path, options)
                        .map_err(|e| S3Error::with_message(S3ErrorCode::InternalError, e.to_string()))?;
                    zip_writer
                        .write_all(&json_str)
                        .map_err(|e| S3Error::with_message(S3ErrorCode::InternalError, e.to_string()))?;
                }
                STS_USER_POLICY_MAPPINGS_FILE => {
                    let mut sts_user_policy_mappings: HashMap<String, MappedPolicy> = HashMap::new();
                    iam_store
                        .load_mapped_policies(UserType::Sts, false, &mut sts_user_policy_mappings)
                        .await
                        .map_err(|e| S3Error::with_message(S3ErrorCode::InternalError, e.to_string()))?;
                    let json_str = serde_json::to_vec(&sts_user_policy_mappings)
                        .map_err(|e| S3Error::with_message(S3ErrorCode::InternalError, e.to_string()))?;
                    zip_writer
                        .start_file(file_path, options)
                        .map_err(|e| S3Error::with_message(S3ErrorCode::InternalError, e.to_string()))?;
                    zip_writer
                        .write_all(&json_str)
                        .map_err(|e| S3Error::with_message(S3ErrorCode::InternalError, e.to_string()))?;
                }
                _ => continue,
            }
        }

        let zip_bytes = zip_writer
            .finish()
            .map_err(|e| S3Error::with_message(S3ErrorCode::InternalError, e.to_string()))?;
        let mut header = HeaderMap::new();
        header.insert(CONTENT_TYPE, "application/zip".parse().unwrap());
        header.insert(CONTENT_DISPOSITION, "attachment; filename=iam-assets.zip".parse().unwrap());
        header.insert(CONTENT_LENGTH, zip_bytes.get_ref().len().to_string().parse().unwrap());
        Ok(S3Response::with_headers((StatusCode::OK, Body::from(zip_bytes.into_inner())), header))
    }
}

