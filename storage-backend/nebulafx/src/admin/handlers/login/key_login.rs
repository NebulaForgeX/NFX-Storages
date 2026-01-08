use http::StatusCode;
use nebulafx_ecstore::global::get_global_action_cred;
use nebulafx_iamx::error::Error as IamError;
use nebulafx_iamx::get_token_signing_key;
use nebulafx_policy::auth::{get_new_credentials_with_metadata, Credentials};
use s3s::{
    Body, S3Error, S3ErrorCode, S3Response, S3Result,
    s3_error,
};
use super::common::{build_claims, build_assume_role_response, AssumeRoleRequest};
use super::error::messages;
use tracing::{error, warn};

/// Handle Key Login request
/// Key Login only uses permanent credentials (AccessKey + SecretKey), no session_token needed
pub(super) async fn handle_key_login(access_key: &str, body: AssumeRoleRequest) -> S3Result<S3Response<(StatusCode, Body)>> {
    warn!("handle KeyLoginHandle");
    let cred = match check_key_valid(access_key).await {
        Ok(c) => c,
        Err(e) => {
            error!("KeyLogin check key valid failed, err: {:?}, access_key: {:?}", e, access_key);
            return Err(e);
        }
    };

    // Build claims
    let claims = build_claims(cred.claims, &body.policy, body.duration_seconds, &cred.access_key)?;

    // Get IAM store
    let iam_store = match nebulafx_iamx::get() {
        Ok(store) => store,
        Err(err) => {
            error!("KeyLogin get IAM store failed, err: {:?}", err);
            return Err(S3Error::with_message(S3ErrorCode::InvalidRequest, messages::IAM_NOT_INIT));
        }
    };

    // Get user policy
    match iam_store.policy_db_get(&cred.access_key, &cred.groups).await {
        Ok(_) => (),
        Err(err) => {
            error!("KeyLogin get policy failed, err: {:?}, access_key: {:?}, groups: {:?}", err, cred.access_key, cred.groups);
            return Err(S3Error::with_message(S3ErrorCode::InvalidArgument, messages::INVALID_POLICY_ARG));
        }
    }

    let secret = match get_token_signing_key() {
        Some(s) => s,
        None => return Err(S3Error::with_message(S3ErrorCode::InvalidArgument, messages::GLOBAL_ACTIVE_SK_NOT_INIT)),
    };

    let mut new_cred = get_new_credentials_with_metadata(&claims, secret.as_str())
        .map_err(|e| S3Error::with_message(S3ErrorCode::InternalError, format!("{} {}", messages::GET_NEW_CRED_FAILED, e)))?;

    new_cred.parent_user = cred.access_key.clone();

    // Save temporary credentials
    match iam_store.set_temp_user(&new_cred.access_key, &new_cred, None).await {
        Ok(_) => (),
        Err(err) => {
            error!("KeyLogin set temp user failed, err: {:?}, access_key: {:?}", err, new_cred.access_key);
            return Err(S3Error::with_message(S3ErrorCode::InternalError, messages::SET_TEMP_USER_FAILED));
        }
    }

    // Build response
    Ok(build_assume_role_response(&new_cred))
}

/// Check permanent key validity for Key Login
async fn check_key_valid(access_key: &str) -> S3Result<Credentials> {
    let Some(mut cred) = get_global_action_cred() else {
        return Err(S3Error::with_message(
            S3ErrorCode::InternalError,
            format!("get_global_action_cred {:?}", IamError::IamSysNotInitialized),
        ));
    };

    if cred.access_key != access_key {
        let Ok(iam_store) = nebulafx_iamx::get() else {
            return Err(S3Error::with_message(
                S3ErrorCode::InternalError,
                format!("check_key_valid {:?}", IamError::IamSysNotInitialized),
            ));
        };

        let (u, ok) = iam_store
            .check_key(access_key)
            .await
            .map_err(|e| S3Error::with_message(S3ErrorCode::InternalError, format!("check key failed {e}")))?;

        if !ok {
            if let Some(u) = u {
                if u.credentials.status == "off" {
                    return Err(s3_error!(InvalidRequest, "ErrAccessKeyDisabled"));
                }
            }

            return Err(s3_error!(InvalidRequest, "ErrAccessKeyDisabled"));
        }

        let Some(u) = u else {
            return Err(s3_error!(InvalidRequest, "check key failed"));
        };

        cred = u.credentials;
    }

    // Only allow permanent credentials for Key Login
    if cred.is_temp() || cred.is_service_account() {
        return Err(S3Error::with_message(S3ErrorCode::InvalidRequest, messages::KEY_LOGIN_REQUIRES_PERMANENT_CRED));
    }

    Ok(cred)
}