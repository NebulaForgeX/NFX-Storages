use crate::admin::utils::has_space_be;
use crate::auth::{get_condition_values, get_session_token};
use crate::{admin::router::Operation, auth::check_key_valid};
use http::HeaderMap;
use hyper::StatusCode;
use matchit::Params;
use nebulafx_ecstore::global::get_global_action_cred;
use nebulafx_iamx::sys::NewServiceAccountOpts;
use nebulafx_madmin::{AddServiceAccountReq, AddServiceAccountResp, Credentials};
use nebulafx_policy::policy::action::{Action, AdminAction};
use nebulafx_policy::policy::{Args, Policy};
use s3s::S3ErrorCode::InvalidRequest;
use s3s::{Body, S3Error, S3Request, S3Response, S3Result, header::CONTENT_TYPE, s3_error};
use std::collections::HashMap;
use tracing::{debug, warn};

pub struct AddServiceAccount {}

#[async_trait::async_trait]
impl Operation for AddServiceAccount {
    async fn call(&self, req: S3Request<Body>, _params: Params<'_, '_>) -> S3Result<S3Response<(StatusCode, Body)>> {
        warn!("handle AddServiceAccount ");
        let Some(req_cred) = req.credentials else {
            return Err(s3_error!(InvalidRequest, "get cred failed"));
        };

        let (cred, owner) =
            check_key_valid(get_session_token(&req.uri, &req.headers).unwrap_or_default(), &req_cred.access_key).await?;

        let mut input = req.input;
        let body = match input.store_all_unlimited().await {
            Ok(b) => b,
            Err(e) => {
                warn!("get body failed, e: {:?}", e);
                return Err(s3_error!(InvalidRequest, "get body failed"));
            }
        };

        let create_req: AddServiceAccountReq =
            serde_json::from_slice(&body[..]).map_err(|e| s3_error!(InvalidRequest, "unmarshal body failed, e: {:?}", e))?;

        if has_space_be(&create_req.access_key) {
            return Err(s3_error!(InvalidRequest, "access key has spaces"));
        }

        create_req
            .validate()
            .map_err(|e| S3Error::with_message(InvalidRequest, e.to_string()))?;

        let session_policy = if let Some(policy) = &create_req.policy {
            let p = Policy::parse_config(policy.as_bytes()).map_err(|e| {
                debug!("parse policy failed, e: {:?}", e);
                s3_error!(InvalidArgument, "parse policy failed")
            })?;
            Some(p)
        } else {
            None
        };

        let Some(sys_cred) = get_global_action_cred() else {
            return Err(s3_error!(InvalidRequest, "get sys cred failed"));
        };

        if sys_cred.access_key == create_req.access_key {
            return Err(s3_error!(InvalidArgument, "can't create user with system access key"));
        }

        let mut target_user = if let Some(u) = create_req.target_user {
            u
        } else {
            cred.access_key.clone()
        };

        let req_user = cred.access_key.clone();
        let mut req_parent_user = cred.access_key.clone();
        let req_groups = cred.groups.clone();
        let mut req_is_derived_cred = false;

        if cred.is_service_account() || cred.is_temp() {
            req_parent_user = cred.parent_user.clone();
            req_is_derived_cred = true;
        }

        let Ok(iam_store) = nebulafx_iamx::get() else {
            return Err(s3_error!(InvalidRequest, "iam not init"));
        };

        let deny_only = cred.access_key == target_user || cred.parent_user == target_user;

        if !iam_store
            .is_allowed(&Args {
                account: &cred.access_key,
                groups: &cred.groups,
                action: Action::AdminAction(AdminAction::CreateServiceAccountAdminAction),
                bucket: "",
                conditions: &get_condition_values(&req.headers, &cred, None, None),
                is_owner: owner,
                object: "",
                claims: cred.claims.as_ref().unwrap_or(&HashMap::new()),
                deny_only,
            })
            .await
        {
            return Err(s3_error!(AccessDenied, "access denied"));
        }

        if target_user != cred.access_key {
            let has_user = iam_store.get_user(&target_user).await;
            if has_user.is_none() && target_user != sys_cred.access_key {
                return Err(s3_error!(InvalidRequest, "target user not exist"));
            }
        }

        let is_svc_acc = target_user == req_user || target_user == req_parent_user;

        let mut target_groups = None;
        let mut opts = NewServiceAccountOpts {
            access_key: create_req.access_key,
            secret_key: create_req.secret_key,
            name: create_req.name,
            description: create_req.description,
            expiration: create_req.expiration,
            session_policy,
            ..Default::default()
        };

        if is_svc_acc {
            if req_is_derived_cred {
                if req_parent_user.is_empty() {
                    return Err(s3_error!(AccessDenied, "only derived cred can create service account"));
                }
                target_user = req_parent_user;
            }

            target_groups = req_groups;

            if let Some(claims) = cred.claims {
                if opts.claims.is_none() {
                    opts.claims = Some(HashMap::new());
                }

                for (k, v) in claims.iter() {
                    if claims.contains_key("exp") {
                        continue;
                    }

                    opts.claims.as_mut().unwrap().insert(k.clone(), v.clone());
                }
            }
        }

        let (new_cred, _) = iam_store
            .new_service_account(&target_user, target_groups, opts)
            .await
            .map_err(|e| {
                debug!("create service account failed, e: {:?}", e);
                s3_error!(InternalError, "create service account failed, e: {:?}", e)
            })?;

        let resp = AddServiceAccountResp {
            credentials: Credentials {
                access_key: &new_cred.access_key,
                secret_key: &new_cred.secret_key,
                session_token: None,
                expiration: new_cred.expiration,
            },
        };

        let body = serde_json::to_vec(&resp).map_err(|e| s3_error!(InternalError, "marshal body failed, e: {:?}", e))?;

        let mut header = HeaderMap::new();
        header.insert(CONTENT_TYPE, "application/json".parse().unwrap());

        Ok(S3Response::with_headers((StatusCode::OK, Body::from(body)), header))
    }
}

