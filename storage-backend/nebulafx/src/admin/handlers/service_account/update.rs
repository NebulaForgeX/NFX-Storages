use crate::auth::{get_condition_values, get_session_token};
use crate::{admin::router::Operation, auth::check_key_valid};
use http::HeaderMap;
use hyper::StatusCode;
use matchit::Params;
use nebulafx_iamx::sys::UpdateServiceAccountOpts;
use nebulafx_madmin::UpdateServiceAccountReq;
use nebulafx_policy::policy::action::{Action, AdminAction};
use nebulafx_policy::policy::{Args, Policy};
use s3s::S3ErrorCode::InvalidRequest;
use s3s::header::CONTENT_LENGTH;
use s3s::{Body, S3Error, S3Request, S3Response, S3Result, header::CONTENT_TYPE, s3_error};
use serde_urlencoded::from_bytes;
use std::collections::HashMap;
use tracing::{debug, warn};

use super::common::AccessKeyQuery;

pub struct UpdateServiceAccount {}

#[async_trait::async_trait]
impl Operation for UpdateServiceAccount {
    async fn call(&self, req: S3Request<Body>, _params: Params<'_, '_>) -> S3Result<S3Response<(StatusCode, Body)>> {
        warn!("handle UpdateServiceAccount");

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

        let mut input = req.input;
        let body = match input.store_all_unlimited().await {
            Ok(b) => b,
            Err(e) => {
                warn!("get body failed, e: {:?}", e);
                return Err(s3_error!(InvalidRequest, "get body failed"));
            }
        };

        let update_req: UpdateServiceAccountReq =
            serde_json::from_slice(&body[..]).map_err(|e| s3_error!(InvalidRequest, "unmarshal body failed, e: {:?}", e))?;

        update_req
            .validate()
            .map_err(|e| S3Error::with_message(InvalidRequest, e.to_string()))?;

        let Some(input_cred) = req.credentials else {
            return Err(s3_error!(InvalidRequest, "get cred failed"));
        };

        let (cred, owner) =
            check_key_valid(get_session_token(&req.uri, &req.headers).unwrap_or_default(), &input_cred.access_key).await?;

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

        let sp = {
            if let Some(policy) = update_req.new_policy {
                let sp = Policy::parse_config(policy.as_bytes()).map_err(|e| {
                    debug!("parse policy failed, e: {:?}", e);
                    s3_error!(InvalidArgument, "parse policy failed")
                })?;

                if sp.version.is_empty() && sp.statements.is_empty() {
                    None
                } else {
                    Some(sp)
                }
            } else {
                None
            }
        };

        let opts = UpdateServiceAccountOpts {
            secret_key: update_req.new_secret_key,
            status: update_req.new_status,
            name: update_req.new_name,
            description: update_req.new_description,
            expiration: update_req.new_expiration,
            session_policy: sp,
        };

        let _ = iam_store.update_service_account(&access_key, opts).await.map_err(|e| {
            debug!("update service account failed, e: {:?}", e);
            s3_error!(InternalError, "update service account failed")
        })?;

        let mut header = HeaderMap::new();
        header.insert(CONTENT_TYPE, "application/json".parse().unwrap());
        header.insert(CONTENT_LENGTH, "0".parse().unwrap());
        Ok(S3Response::with_headers((StatusCode::OK, Body::empty()), header))
    }
}

