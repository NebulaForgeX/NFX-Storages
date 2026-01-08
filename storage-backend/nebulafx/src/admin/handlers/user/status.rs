use crate::{
    admin::{auth::validate_admin_request, router::Operation},
    auth::{check_key_valid, get_session_token},
};
use http::{HeaderMap, StatusCode};
use matchit::Params;
use nebulafx_madmin::AccountStatus;
use nebulafx_policy::policy::action::{Action, AdminAction};
use s3s::{
    Body, S3Error, S3ErrorCode, S3Request, S3Response, S3Result,
    header::{CONTENT_LENGTH, CONTENT_TYPE},
    s3_error,
};
use serde_urlencoded::from_bytes;

use super::common::AddUserQuery;

pub struct SetUserStatus {}

#[async_trait::async_trait]
impl Operation for SetUserStatus {
    async fn call(&self, req: S3Request<Body>, _params: Params<'_, '_>) -> S3Result<S3Response<(StatusCode, Body)>> {
        let query = {
            if let Some(query) = req.uri.query() {
                let input: AddUserQuery =
                    from_bytes(query.as_bytes()).map_err(|_e| s3_error!(InvalidArgument, "get body failed"))?;
                input
            } else {
                AddUserQuery::default()
            }
        };

        let ak = query.access_key.as_deref().unwrap_or_default();

        if ak.is_empty() {
            return Err(s3_error!(InvalidArgument, "access key is empty"));
        }

        let Some(input_cred) = req.credentials else {
            return Err(s3_error!(InvalidRequest, "get cred failed"));
        };

        if input_cred.access_key == ak {
            return Err(s3_error!(InvalidArgument, "can't change status of self"));
        }

        let (cred, owner) =
            check_key_valid(get_session_token(&req.uri, &req.headers).unwrap_or_default(), &input_cred.access_key).await?;

        validate_admin_request(
            &req.headers,
            &cred,
            owner,
            false,
            vec![Action::AdminAction(AdminAction::EnableUserAdminAction)],
        )
        .await?;

        let status = AccountStatus::try_from(query.status.as_deref().unwrap_or_default())
            .map_err(|e| S3Error::with_message(S3ErrorCode::InvalidArgument, e))?;

        let Ok(iam_store) = nebulafx_iamx::get() else {
            return Err(s3_error!(InvalidRequest, "iam not init"));
        };

        iam_store
            .set_user_status(ak, status)
            .await
            .map_err(|e| S3Error::with_message(S3ErrorCode::InternalError, format!("set_user_status err {e}")))?;

        let mut header = HeaderMap::new();
        header.insert(CONTENT_TYPE, "application/json".parse().unwrap());
        header.insert(CONTENT_LENGTH, "0".parse().unwrap());
        Ok(S3Response::with_headers((StatusCode::OK, Body::empty()), header))
    }
}

