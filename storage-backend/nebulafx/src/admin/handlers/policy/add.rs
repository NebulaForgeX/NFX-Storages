use crate::{
    admin::{auth::validate_admin_request, router::Operation, utils::has_space_be},
    auth::{check_key_valid, get_session_token},
};
use http::{HeaderMap, StatusCode};
use matchit::Params;
use nebulafx_policy::policy::{
    Policy,
    action::{Action, AdminAction},
};
use s3s::{
    Body, S3Error, S3ErrorCode, S3Request, S3Response, S3Result,
    header::{CONTENT_LENGTH, CONTENT_TYPE},
    s3_error,
};
use serde_urlencoded::from_bytes;
use tracing::warn;

use super::common::PolicyNameQuery;

pub struct AddCannedPolicy {}

#[async_trait::async_trait]
impl Operation for AddCannedPolicy {
    async fn call(&self, req: S3Request<Body>, _params: Params<'_, '_>) -> S3Result<S3Response<(StatusCode, Body)>> {
        warn!("handle AddCannedPolicy");

        let Some(input_cred) = req.credentials else {
            return Err(s3_error!(InvalidRequest, "get cred failed"));
        };

        let (cred, owner) =
            check_key_valid(get_session_token(&req.uri, &req.headers).unwrap_or_default(), &input_cred.access_key).await?;

        validate_admin_request(
            &req.headers,
            &cred,
            owner,
            false,
            vec![Action::AdminAction(AdminAction::CreatePolicyAdminAction)],
        )
        .await?;

        let query = {
            if let Some(query) = req.uri.query() {
                let input: PolicyNameQuery =
                    from_bytes(query.as_bytes()).map_err(|_e| s3_error!(InvalidArgument, "get body failed1"))?;
                input
            } else {
                PolicyNameQuery::default()
            }
        };

        if query.name.is_empty() {
            return Err(s3_error!(InvalidArgument, "policy name is empty"));
        }

        if has_space_be(&query.name) {
            return Err(s3_error!(InvalidArgument, "policy name has space"));
        }

        let mut input = req.input;
        let policy_bytes = match input.store_all_unlimited().await {
            Ok(b) => b,
            Err(e) => {
                warn!("get body failed, e: {:?}", e);
                return Err(s3_error!(InvalidRequest, "get body failed"));
            }
        };

        let policy = Policy::parse_config(policy_bytes.as_ref()).map_err(|e| {
            warn!("parse policy failed, e: {:?}", e);
            S3Error::with_message(S3ErrorCode::InvalidRequest, e.to_string())
        })?;

        if policy.version.is_empty() {
            return Err(s3_error!(InvalidRequest, "policy version is empty"));
        }

        let Ok(iam_store) = nebulafx_iamx::get() else { return Err(s3_error!(InternalError, "iam not init")) };

        iam_store.set_policy(&query.name, policy).await.map_err(|e| {
            warn!("set policy failed, e: {:?}", e);
            S3Error::with_message(S3ErrorCode::InternalError, e.to_string())
        })?;

        let mut header = HeaderMap::new();
        header.insert(CONTENT_TYPE, "application/json".parse().unwrap());
        header.insert(CONTENT_LENGTH, "0".parse().unwrap());
        Ok(S3Response::with_headers((StatusCode::OK, Body::empty()), header))
    }
}

