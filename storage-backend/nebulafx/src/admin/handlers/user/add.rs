use crate::{
    admin::{auth::validate_admin_request, router::Operation, utils::has_space_be},
    auth::{check_key_valid, get_session_token},
};
use http::{HeaderMap, StatusCode};
use matchit::Params;
use nebulafx_ecstore::global::get_global_action_cred;
use nebulafx_madmin::AddOrUpdateUserReq;
use nebulafx_policy::policy::action::{Action, AdminAction};
use s3s::{
    Body, S3Error, S3ErrorCode, S3Request, S3Response, S3Result,
    header::{CONTENT_LENGTH, CONTENT_TYPE},
    s3_error,
};
use serde_urlencoded::from_bytes;
use std::str::from_utf8;
use tracing::warn;

use super::common::AddUserQuery;

pub struct AddUser {}

#[async_trait::async_trait]
impl Operation for AddUser {
    async fn call(&self, req: S3Request<Body>, _params: Params<'_, '_>) -> S3Result<S3Response<(StatusCode, Body)>> {
        let query = {
            if let Some(query) = req.uri.query() {
                let input: AddUserQuery =
                    from_bytes(query.as_bytes()).map_err(|_e| s3_error!(InvalidArgument, "get body failed1"))?;
                input
            } else {
                AddUserQuery::default()
            }
        };

        let Some(input_cred) = req.credentials else {
            return Err(s3_error!(InvalidRequest, "get cred failed"));
        };

        let (cred, owner) =
            check_key_valid(get_session_token(&req.uri, &req.headers).unwrap_or_default(), &input_cred.access_key).await?;

        let ak = query.access_key.as_deref().unwrap_or_default();

        if ak.is_empty() {
            return Err(s3_error!(InvalidArgument, "access key is empty"));
        }

        let mut input = req.input;
        let body = match input.store_all_unlimited().await {
            Ok(b) => b,
            Err(e) => {
                warn!("get body failed, e: {:?}", e);
                return Err(s3_error!(InvalidRequest, "get body failed"));
            }
        };

        let args: AddOrUpdateUserReq = serde_json::from_slice(&body)
            .map_err(|e| S3Error::with_message(S3ErrorCode::InternalError, format!("unmarshal body err {e}")))?;

        if args.secret_key.is_empty() {
            return Err(s3_error!(InvalidArgument, "access key is empty"));
        }

        if let Some(sys_cred) = get_global_action_cred() {
            if sys_cred.access_key == ak {
                return Err(s3_error!(InvalidArgument, "can't create user with system access key"));
            }
        }

        let Ok(iam_store) = nebulafx_iamx::get() else {
            return Err(s3_error!(InvalidRequest, "iam not init"));
        };

        if let Some(user) = iam_store.get_user(ak).await {
            if (user.credentials.is_temp() || user.credentials.is_service_account()) && cred.parent_user == ak {
                return Err(s3_error!(InvalidArgument, "can't create user with service account access key"));
            }
        } else if has_space_be(ak) {
            return Err(s3_error!(InvalidArgument, "access key has space"));
        }

        if from_utf8(ak.as_bytes()).is_err() {
            return Err(s3_error!(InvalidArgument, "access key is not utf8"));
        }

        let deny_only = ak == cred.access_key;
        validate_admin_request(
            &req.headers,
            &cred,
            owner,
            deny_only,
            vec![Action::AdminAction(AdminAction::CreateUserAdminAction)],
        )
        .await?;

        iam_store
            .create_user(ak, &args)
            .await
            .map_err(|e| S3Error::with_message(S3ErrorCode::InternalError, format!("create_user err {e}")))?;

        let mut header = HeaderMap::new();
        header.insert(CONTENT_TYPE, "application/json".parse().unwrap());
        header.insert(CONTENT_LENGTH, "0".parse().unwrap());
        Ok(S3Response::with_headers((StatusCode::OK, Body::empty()), header))
    }
}

