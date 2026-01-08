use crate::{
    admin::{auth::validate_admin_request, router::Operation, utils::has_space_be},
    auth::{check_key_valid, get_session_token},
};
use http::{HeaderMap, StatusCode};
use matchit::Params;
use nebulafx_ecstore::global::get_global_action_cred;
use nebulafx_iamx::error::{is_err_no_such_group, is_err_no_such_user};
use nebulafx_madmin::GroupAddRemove;
use nebulafx_policy::policy::action::{Action, AdminAction};
use s3s::{
    Body, S3Error, S3ErrorCode, S3Request, S3Response, S3Result,
    header::{CONTENT_LENGTH, CONTENT_TYPE},
    s3_error,
};
use tracing::warn;

pub struct UpdateGroupMembers {}

#[async_trait::async_trait]
impl Operation for UpdateGroupMembers {
    async fn call(&self, req: S3Request<Body>, _params: Params<'_, '_>) -> S3Result<S3Response<(StatusCode, Body)>> {
        warn!("handle UpdateGroupMembers");

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
            vec![Action::AdminAction(AdminAction::AddUserToGroupAdminAction)],
        )
        .await?;

        let mut input = req.input;
        let body = match input.store_all_unlimited().await {
            Ok(b) => b,
            Err(e) => {
                warn!("get body failed, e: {:?}", e);
                return Err(s3_error!(InvalidRequest, "get body failed"));
            }
        };

        let args: GroupAddRemove = serde_json::from_slice(&body)
            .map_err(|e| S3Error::with_message(S3ErrorCode::InternalError, format!("unmarshal body err {e}")))?;

        warn!("UpdateGroupMembers args {:?}", args);

        let Ok(iam_store) = nebulafx_iamx::get() else { return Err(s3_error!(InternalError, "iam not init")) };

        for member in args.members.iter() {
            match iam_store.is_temp_user(member).await {
                Ok((is_temp, _)) => {
                    if is_temp {
                        return Err(S3Error::with_message(
                            S3ErrorCode::MethodNotAllowed,
                            format!("can't add temp user {member}"),
                        ));
                    }

                    get_global_action_cred()
                        .map(|cred| {
                            if cred.access_key == *member {
                                return Err(S3Error::with_message(
                                    S3ErrorCode::MethodNotAllowed,
                                    format!("can't add root {member}"),
                                ));
                            }
                            Ok(())
                        })
                        .unwrap_or_else(|| {
                            Err(S3Error::with_message(S3ErrorCode::InternalError, "get global cred failed".to_string()))
                        })?;
                }
                Err(e) => {
                    if !is_err_no_such_user(&e) {
                        return Err(S3Error::with_message(S3ErrorCode::InternalError, e.to_string()));
                    }
                }
            }
        }

        if args.is_remove {
            warn!("remove group members");
            iam_store
                .remove_users_from_group(&args.group, args.members)
                .await
                .map_err(|e| {
                    warn!("remove group members failed, e: {:?}", e);
                    S3Error::with_message(S3ErrorCode::InternalError, e.to_string())
                })?;
        } else {
            warn!("add group members");

            if let Err(err) = iam_store.get_group_description(&args.group).await {
                if is_err_no_such_group(&err) && has_space_be(&args.group) {
                    return Err(s3_error!(InvalidArgument, "not such group"));
                }
            }

            iam_store.add_users_to_group(&args.group, args.members).await.map_err(|e| {
                warn!("add group members failed, e: {:?}", e);
                S3Error::with_message(S3ErrorCode::InternalError, e.to_string())
            })?;
        }

        let mut header = HeaderMap::new();
        header.insert(CONTENT_TYPE, "application/json".parse().unwrap());
        header.insert(CONTENT_LENGTH, "0".parse().unwrap());
        Ok(S3Response::with_headers((StatusCode::OK, Body::empty()), header))
    }
}

