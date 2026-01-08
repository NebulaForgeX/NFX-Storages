use crate::auth::{get_condition_values, get_session_token};
use crate::{admin::router::Operation, auth::check_key_valid};
use http::HeaderMap;
use hyper::StatusCode;
use matchit::Params;
use nebulafx_iamx::error::is_err_no_such_service_account;
use nebulafx_policy::policy::action::{Action, AdminAction};
use nebulafx_policy::policy::Args;
use s3s::header::CONTENT_LENGTH;
use s3s::{Body, S3Request, S3Response, S3Result, header::CONTENT_TYPE, s3_error};
use serde_urlencoded::from_bytes;
use std::collections::HashMap;
use tracing::debug;

use super::common::AccessKeyQuery;

pub struct DeleteServiceAccount {}

#[async_trait::async_trait]
impl Operation for DeleteServiceAccount {
    async fn call(&self, req: S3Request<Body>, _params: Params<'_, '_>) -> S3Result<S3Response<(StatusCode, Body)>> {
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

        let query = {
            if let Some(query) = req.uri.query() {
                let input: AccessKeyQuery =
                    from_bytes(query.as_bytes()).map_err(|_e| s3_error!(InvalidArgument, "get body failed"))?;
                input
            } else {
                AccessKeyQuery::default()
            }
        };

        if query.access_key.is_empty() {
            return Err(s3_error!(InvalidArgument, "access key is empty"));
        }

        let Ok(iam_store) = nebulafx_iamx::get() else {
            return Err(s3_error!(InvalidRequest, "iam not init"));
        };

        let svc_account = match iam_store.get_service_account(&query.access_key).await {
            Ok((res, _)) => Some(res),
            Err(err) => {
                if is_err_no_such_service_account(&err) {
                    return Err(s3_error!(InvalidRequest, "service account not exist"));
                }

                None
            }
        };

        if !iam_store
            .is_allowed(&Args {
                account: &cred.access_key,
                groups: &cred.groups,
                action: Action::AdminAction(AdminAction::RemoveServiceAccountAdminAction),
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

            if svc_account.is_some_and(|v| &v.parent_user != user) {
                return Err(s3_error!(InvalidRequest, "service account not exist"));
            }
        }

        iam_store.delete_service_account(&query.access_key, true).await.map_err(|e| {
            debug!("delete service account failed, e: {:?}", e);
            s3_error!(InternalError, "delete service account failed")
        })?;

        let mut header = HeaderMap::new();
        header.insert(CONTENT_TYPE, "application/json".parse().unwrap());
        header.insert(CONTENT_LENGTH, "0".parse().unwrap());
        Ok(S3Response::with_headers((StatusCode::OK, Body::empty()), header))
    }
}

