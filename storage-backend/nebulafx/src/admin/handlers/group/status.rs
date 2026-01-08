use crate::{
    admin::{auth::validate_admin_request, router::Operation},
    auth::{check_key_valid, get_session_token},
};
use http::{HeaderMap, StatusCode};
use matchit::Params;
use nebulafx_policy::policy::action::{Action, AdminAction};
use s3s::{
    Body, S3Error, S3ErrorCode, S3Request, S3Response, S3Result,
    header::{CONTENT_LENGTH, CONTENT_TYPE},
    s3_error,
};
use serde_urlencoded::from_bytes;
use tracing::warn;

use super::common::GroupQuery;

pub struct SetGroupStatus {}

#[async_trait::async_trait]
impl Operation for SetGroupStatus {
    async fn call(&self, req: S3Request<Body>, _params: Params<'_, '_>) -> S3Result<S3Response<(StatusCode, Body)>> {
        warn!("handle SetGroupStatus");

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
            vec![Action::AdminAction(AdminAction::EnableGroupAdminAction)],
        )
        .await?;

        let query = {
            if let Some(query) = req.uri.query() {
                let input: GroupQuery =
                    from_bytes(query.as_bytes()).map_err(|_e| s3_error!(InvalidArgument, "get body failed1"))?;
                input
            } else {
                GroupQuery::default()
            }
        };

        if query.group.is_empty() {
            return Err(s3_error!(InvalidArgument, "group is required"));
        }

        let Ok(iam_store) = nebulafx_iamx::get() else { return Err(s3_error!(InternalError, "iam not init")) };

        if let Some(status) = query.status {
            match status.as_str() {
                "enabled" => {
                    iam_store.set_group_status(&query.group, true).await.map_err(|e| {
                        warn!("enable group failed, e: {:?}", e);
                        S3Error::with_message(S3ErrorCode::InternalError, e.to_string())
                    })?;
                }
                "disabled" => {
                    iam_store.set_group_status(&query.group, false).await.map_err(|e| {
                        warn!("enable group failed, e: {:?}", e);
                        S3Error::with_message(S3ErrorCode::InternalError, e.to_string())
                    })?;
                }
                _ => {
                    return Err(s3_error!(InvalidArgument, "invalid status"));
                }
            }
        } else {
            return Err(s3_error!(InvalidArgument, "status is required"));
        }

        let mut header = HeaderMap::new();
        header.insert(CONTENT_TYPE, "application/json".parse().unwrap());
        header.insert(CONTENT_LENGTH, "0".parse().unwrap());
        Ok(S3Response::with_headers((StatusCode::OK, Body::empty()), header))
    }
}

