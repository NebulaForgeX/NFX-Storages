use crate::{
    admin::{auth::validate_admin_request, router::Operation},
    auth::{check_key_valid, get_session_token},
};
use http::{HeaderMap, StatusCode};
use matchit::Params;
use nebulafx_ecstore::global::get_global_action_cred;
use nebulafx_iamx::error::is_err_no_such_user;
use nebulafx_iamx::UserType;
use nebulafx_policy::policy::action::{Action, AdminAction};
use s3s::{
    Body, S3Error, S3ErrorCode, S3Request, S3Response, S3Result,
    header::{CONTENT_LENGTH, CONTENT_TYPE},
    s3_error,
};
use serde_urlencoded::from_bytes;
use tracing::warn;

use super::common::SetPolicyForUserOrGroupQuery;

pub struct SetPolicyForUserOrGroup {}

#[async_trait::async_trait]
impl Operation for SetPolicyForUserOrGroup {
    async fn call(&self, req: S3Request<Body>, _params: Params<'_, '_>) -> S3Result<S3Response<(StatusCode, Body)>> {
        warn!("handle SetPolicyForUserOrGroup");

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
            vec![Action::AdminAction(AdminAction::AttachPolicyAdminAction)],
        )
        .await?;

        let query = {
            if let Some(query) = req.uri.query() {
                let input: SetPolicyForUserOrGroupQuery =
                    from_bytes(query.as_bytes()).map_err(|_e| s3_error!(InvalidArgument, "get body failed1"))?;
                input
            } else {
                SetPolicyForUserOrGroupQuery::default()
            }
        };

        if query.user_or_group.is_empty() {
            return Err(s3_error!(InvalidArgument, "user or group is empty"));
        }

        let Ok(iam_store) = nebulafx_iamx::get() else { return Err(s3_error!(InternalError, "iam not init")) };

        if !query.is_group {
            match iam_store.is_temp_user(&query.user_or_group).await {
                Ok((ok, _)) => {
                    if ok {
                        return Err(s3_error!(InvalidArgument, "temp user can't set policy"));
                    }
                }
                Err(err) => {
                    if !is_err_no_such_user(&err) {
                        warn!("is temp user failed, e: {:?}", err);
                        return Err(S3Error::with_message(S3ErrorCode::InternalError, err.to_string()));
                    }
                }
            };

            let Some(sys_cred) = get_global_action_cred() else {
                return Err(s3_error!(InternalError, "get global action cred failed"));
            };

            if query.user_or_group == sys_cred.access_key {
                return Err(s3_error!(InvalidArgument, "can't set policy for system user"));
            }
        }

        if !query.is_group {
            if iam_store.get_user(&query.user_or_group).await.is_none() {
                return Err(s3_error!(InvalidArgument, "user not exist"));
            }
        } else {
            iam_store.get_group_description(&query.user_or_group).await.map_err(|e| {
                warn!("get group description failed, e: {:?}", e);
                S3Error::with_message(S3ErrorCode::InternalError, e.to_string())
            })?;
        }

        iam_store
            .policy_db_set(&query.user_or_group, UserType::Reg, query.is_group, &query.policy_name)
            .await
            .map_err(|e| {
                warn!("policy db set failed, e: {:?}", e);
                S3Error::with_message(S3ErrorCode::InternalError, e.to_string())
            })?;

        let mut header = HeaderMap::new();
        header.insert(CONTENT_TYPE, "application/json".parse().unwrap());
        header.insert(CONTENT_LENGTH, "0".parse().unwrap());
        Ok(S3Response::with_headers((StatusCode::OK, Body::empty()), header))
    }
}

