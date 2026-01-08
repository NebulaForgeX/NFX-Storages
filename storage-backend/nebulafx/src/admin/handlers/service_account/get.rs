use crate::auth::{get_condition_values, get_session_token};
use crate::{admin::router::Operation, auth::check_key_valid};
use http::HeaderMap;
use hyper::StatusCode;
use matchit::Params;
use nebulafx_madmin::InfoServiceAccountResp;
use nebulafx_policy::policy::action::{Action, AdminAction};
use nebulafx_policy::policy::Args;
use s3s::{Body, S3Request, S3Response, S3Result, header::CONTENT_TYPE, s3_error};
use serde_urlencoded::from_bytes;
use std::collections::HashMap;
use tracing::debug;

use super::common::AccessKeyQuery;

pub struct InfoServiceAccount {}

#[async_trait::async_trait]
impl Operation for InfoServiceAccount {
    async fn call(&self, req: S3Request<Body>, _params: Params<'_, '_>) -> S3Result<S3Response<(StatusCode, Body)>> {
        let query = {
            if let Some(query) = req.uri.query() {
                let input: AccessKeyQuery =
                    from_bytes(query.as_bytes()).map_err(|_e| s3_error!(InvalidArgument, "get body failed1"))?;
                input
            } else {
                AccessKeyQuery::default()
            }
        };

        if query.access_key.is_empty() {
            return Err(s3_error!(InvalidArgument, "access key is empty"));
        }

        let access_key = query.access_key;

        let Ok(iam_store) = nebulafx_iamx::get() else {
            return Err(s3_error!(InvalidRequest, "iam not init"));
        };

        let (svc_account, session_policy) = iam_store.get_service_account(&access_key).await.map_err(|e| {
            debug!("get service account failed, e: {:?}", e);
            s3_error!(InternalError, "get service account failed")
        })?;

        let Some(input_cred) = req.credentials else {
            return Err(s3_error!(InvalidRequest, "get cred failed"));
        };

        let (cred, owner) =
            check_key_valid(get_session_token(&req.uri, &req.headers).unwrap_or_default(), &input_cred.access_key).await?;

        if !iam_store
            .is_allowed(&Args {
                account: &cred.access_key,
                groups: &cred.groups,
                action: Action::AdminAction(AdminAction::ListServiceAccountsAdminAction),
                bucket: "",
                conditions: &get_condition_values(&req.headers, &cred, None, None),
                is_owner: owner,
                object: "",
                claims: cred.claims.as_ref().unwrap_or(&HashMap::new()),
                deny_only: false,
            })
            .await
        {
            let user = if cred.parent_user.is_empty() {
                &cred.access_key
            } else {
                &cred.parent_user
            };
            if user != &svc_account.parent_user {
                return Err(s3_error!(AccessDenied, "access denied"));
            }
        }

        let implied_policy = if let Some(policy) = session_policy.as_ref() {
            policy.version.is_empty() && policy.statements.is_empty()
        } else {
            true
        };

        let svc_account_policy = {
            if !implied_policy {
                session_policy
            } else {
                let policies = iam_store
                    .policy_db_get(&svc_account.parent_user, &svc_account.groups)
                    .await
                    .map_err(|e| {
                        debug!("get service account policy failed, e: {:?}", e);
                        s3_error!(InternalError, "get service account policy failed")
                    })?;

                Some(iam_store.get_combined_policy(&policies).await)
            }
        };

        let policy = {
            if let Some(policy) = svc_account_policy {
                Some(serde_json::to_string(&policy).map_err(|e| {
                    debug!("marshal policy failed, e: {:?}", e);
                    s3_error!(InternalError, "marshal policy failed")
                })?)
            } else {
                None
            }
        };

        let resp = InfoServiceAccountResp {
            parent_user: svc_account.parent_user,
            account_status: svc_account.status,
            implied_policy,
            name: svc_account.name,
            description: svc_account.description,
            expiration: svc_account.expiration,
            policy,
        };

        let body = serde_json::to_vec(&resp).map_err(|e| s3_error!(InternalError, "marshal body failed, e: {:?}", e))?;

        let mut header = HeaderMap::new();
        header.insert(CONTENT_TYPE, "application/json".parse().unwrap());

        Ok(S3Response::with_headers((StatusCode::OK, Body::from(body)), header))
    }
}

