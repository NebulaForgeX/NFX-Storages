use crate::{
    admin::{auth::validate_admin_request, router::Operation},
    auth::{check_key_valid, get_session_token},
};
use http::{HeaderMap, StatusCode};
use matchit::Params;
use nebulafx_iamx::MappedPolicy;
use nebulafx_policy::policy::action::{Action, AdminAction};
use s3s::{
    Body, S3Error, S3ErrorCode, S3Request, S3Response, S3Result,
    header::CONTENT_TYPE,
    s3_error,
};
use serde_urlencoded::from_bytes;
use tracing::warn;

use super::common::PolicyNameQuery;

pub struct InfoCannedPolicy {}

#[async_trait::async_trait]
impl Operation for InfoCannedPolicy {
    async fn call(&self, req: S3Request<Body>, _params: Params<'_, '_>) -> S3Result<S3Response<(StatusCode, Body)>> {
        warn!("handle InfoCannedPolicy");

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
            vec![Action::AdminAction(AdminAction::GetPolicyAdminAction)],
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

        let policies = MappedPolicy::new(&query.name).to_slice();
        if policies.len() != 1 {
            return Err(s3_error!(InvalidArgument, "too many policies"));
        }

        let Ok(iam_store) = nebulafx_iamx::get() else { return Err(s3_error!(InternalError, "iam not init")) };

        let pd = iam_store.info_policy(&query.name).await.map_err(|e| {
            warn!("info policy failed, e: {:?}", e);
            S3Error::with_message(S3ErrorCode::InternalError, e.to_string())
        })?;

        let body = serde_json::to_vec(&pd).map_err(|e| s3_error!(InternalError, "marshal body failed, e: {:?}", e))?;

        let mut header = HeaderMap::new();
        header.insert(CONTENT_TYPE, "application/json".parse().unwrap());

        Ok(S3Response::with_headers((StatusCode::OK, Body::from(body)), header))
    }
}

