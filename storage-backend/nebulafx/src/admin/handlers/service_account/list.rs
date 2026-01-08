use crate::auth::{get_condition_values, get_session_token};
use crate::{admin::router::Operation, auth::check_key_valid};
use http::HeaderMap;
use hyper::StatusCode;
use matchit::Params;
use nebulafx_madmin::{ListServiceAccountsResp, ServiceAccountInfo};
use nebulafx_policy::policy::action::{Action, AdminAction};
use nebulafx_policy::policy::Args;
use s3s::{Body, S3Error, S3ErrorCode, S3Request, S3Response, S3Result, header::CONTENT_TYPE, s3_error};
use serde_urlencoded::from_bytes;
use std::collections::HashMap;
use tracing::debug;

use super::common::ListServiceAccountQuery;

pub struct ListServiceAccount {}

#[async_trait::async_trait]
impl Operation for ListServiceAccount {
    async fn call(&self, req: S3Request<Body>, _params: Params<'_, '_>) -> S3Result<S3Response<(StatusCode, Body)>> {
        let query = {
            if let Some(query) = req.uri.query() {
                let input: ListServiceAccountQuery =
                    from_bytes(query.as_bytes()).map_err(|_e| s3_error!(InvalidArgument, "get body failed"))?;
                input
            } else {
                ListServiceAccountQuery::default()
            }
        };

        let Some(input_cred) = req.credentials else {
            return Err(s3_error!(InvalidRequest, "get cred failed"));
        };

        let (cred, owner) =
            check_key_valid(get_session_token(&req.uri, &req.headers).unwrap_or_default(), &input_cred.access_key)
                .await
                .map_err(|e| {
                    debug!("check key failed: {e:?}");
                    s3_error!(InternalError, "check key failed")
                })?;

        let Ok(iam_store) = nebulafx_iamx::get() else {
            return Err(s3_error!(InvalidRequest, "iam not init"));
        };

        let target_account = if query.user.as_ref().is_some_and(|v| v != &cred.access_key) {
            if !iam_store
                .is_allowed(&Args {
                    account: &cred.access_key,
                    groups: &cred.groups,
                    action: Action::AdminAction(AdminAction::UpdateServiceAccountAdminAction),
                    bucket: "",
                    conditions: &get_condition_values(&req.headers, &cred, None, None),
                    is_owner: owner,
                    object: "",
                    claims: cred.claims.as_ref().unwrap_or(&HashMap::new()),
                    deny_only: false,
                })
                .await
            {
                return Err(s3_error!(AccessDenied, "access denied"));
            }

            query.user.unwrap_or_default()
        } else if cred.parent_user.is_empty() {
            cred.access_key
        } else {
            cred.parent_user
        };

        let service_accounts = iam_store.list_service_accounts(&target_account).await.map_err(|e| {
            debug!("list service account failed: {e:?}");
            s3_error!(InternalError, "list service account failed")
        })?;

        let accounts: Vec<ServiceAccountInfo> = service_accounts
            .into_iter()
            .map(|sa| ServiceAccountInfo {
                parent_user: sa.parent_user.clone(),
                account_status: sa.status.clone(),
                implied_policy: sa.is_implied_policy(),
                access_key: sa.access_key,
                name: sa.name,
                description: sa.description,
                expiration: sa.expiration,
            })
            .collect();

        let data = serde_json::to_vec(&ListServiceAccountsResp { accounts })
            .map_err(|e| S3Error::with_message(S3ErrorCode::InternalError, format!("marshal users err {e}")))?;

        let mut header = HeaderMap::new();
        header.insert(CONTENT_TYPE, "application/json".parse().unwrap());

        Ok(S3Response::with_headers((StatusCode::OK, Body::from(data)), header))
    }
}

