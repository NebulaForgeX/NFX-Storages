use crate::{
    admin::{auth::validate_admin_request, router::Operation},
    auth::{check_key_valid, get_session_token},
};
use http::{HeaderMap, StatusCode};
use matchit::Params;
use nebulafx_policy::policy::action::{Action, AdminAction};
use s3s::{
    Body, S3Error, S3ErrorCode, S3Request, S3Response, S3Result,
    header::CONTENT_TYPE,
    s3_error,
};
use serde_urlencoded::from_bytes;

use super::common::BucketQuery;

pub struct ListUsers {}

#[async_trait::async_trait]
impl Operation for ListUsers {
    async fn call(&self, req: S3Request<Body>, _params: Params<'_, '_>) -> S3Result<S3Response<(StatusCode, Body)>> {
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
            vec![Action::AdminAction(AdminAction::ListUsersAdminAction)],
        )
        .await?;

        let query = {
            if let Some(query) = req.uri.query() {
                let input: BucketQuery =
                    from_bytes(query.as_bytes()).map_err(|_e| s3_error!(InvalidArgument, "get body failed"))?;
                input
            } else {
                BucketQuery::default()
            }
        };

        let Ok(iam_store) = nebulafx_iamx::get() else {
            return Err(s3_error!(InvalidRequest, "iam not init"));
        };

        let users = {
            if !query.bucket.is_empty() {
                iam_store
                    .list_bucket_users(query.bucket.as_str())
                    .await
                    .map_err(|e| S3Error::with_message(S3ErrorCode::InternalError, e.to_string()))?
            } else {
                iam_store
                    .list_users()
                    .await
                    .map_err(|e| S3Error::with_message(S3ErrorCode::InternalError, e.to_string()))?
            }
        };

        let data = serde_json::to_vec(&users)
            .map_err(|e| S3Error::with_message(S3ErrorCode::InternalError, format!("marshal users err {e}")))?;

        let mut header = HeaderMap::new();
        header.insert(CONTENT_TYPE, "application/json".parse().unwrap());

        Ok(S3Response::with_headers((StatusCode::OK, Body::from(data)), header))
    }
}

