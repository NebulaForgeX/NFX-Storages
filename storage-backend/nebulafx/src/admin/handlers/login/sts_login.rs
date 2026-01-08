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
use tracing::{error, info, warn};

/// Handle STS Login request
/// STS Login uses permanent credentials with session_token for AssumeRole
/// Note: Currently STS Login uses AssumeRole, but may be extended in the future
/// to support direct STS token validation
pub(super) async fn handle_sts_login(
    access_key: &str,
    body: AssumeRoleRequest,
    session_token: Option<&str>,
) -> S3Result<S3Response<(StatusCode, Body)>> {
    warn!("handle StsLoginHandle");

    // STS Login may have session token in the request
    // For now, we still use AssumeRole flow, but this can be extended
    // to validate existing STS tokens directly
    // If session token is provided, we could validate it directly
    // For now, we still require permanent credentials for AssumeRole
    if session_token.is_some() {
        // TODO: In the future, this could validate the existing STS token
        // and return a refreshed token instead of using AssumeRole
        warn!("STS Login with existing session token - using AssumeRole flow");
    }

    // Validate credentials
    let cred = check_key_valid(access_key, session_token).await?;

    // Only allow permanent credentials for STS Login via AssumeRole
    // TODO: In the future, this could accept temporary credentials for token refresh
    if cred.is_temp() || cred.is_service_account() {
        return Err(S3Error::with_message(S3ErrorCode::InvalidRequest, messages::STS_LOGIN_REQUIRES_PERMANENT_CRED));
    }

    // Build claims
    let claims = build_claims(cred.claims, &body.policy, body.duration_seconds, &cred.access_key)?;

    // Get IAM store
    let Ok(iam_store) = nebulafx_iamx::get() else {
        return Err(S3Error::with_message(S3ErrorCode::InvalidRequest, messages::IAM_NOT_INIT));
    };

    // Get user policy
    if let Err(_err) = iam_store.policy_db_get(&cred.access_key, &cred.groups).await {
        error!(
            "StsLogin get policy failed, err: {:?}, access_key: {:?}, groups: {:?}",
            _err, cred.access_key, cred.groups
        );
        return Err(S3Error::with_message(S3ErrorCode::InvalidArgument, messages::INVALID_POLICY_ARG));
    }

    // Get signing key
    let Some(secret) = get_token_signing_key() else {
        return Err(S3Error::with_message(S3ErrorCode::InvalidArgument, messages::GLOBAL_ACTIVE_SK_NOT_INIT));
    };

    info!("StsLogin get claims {:?}", &claims);

    // Generate new temporary credentials
    let mut new_cred = get_new_credentials_with_metadata(&claims, &secret)
        .map_err(|e| S3Error::with_message(S3ErrorCode::InternalError, format!("{} {}", messages::GET_NEW_CRED_FAILED, e)))?;

    new_cred.parent_user = cred.access_key.clone();

    info!("StsLogin get new_cred {:?}", &new_cred);

    // Save temporary credentials
    if let Err(_err) = iam_store.set_temp_user(&new_cred.access_key, &new_cred, None).await {
        return Err(S3Error::with_message(S3ErrorCode::InternalError, messages::SET_TEMP_USER_FAILED));
    }

    // Build response
    Ok(build_assume_role_response(&new_cred))
}

/// Check key validity for STS Login
/// STS Login may have session_token, so we need to validate it as well
async fn check_key_valid(access_key: &str, session_token: Option<&str>) -> S3Result<Credentials> {
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

    // Validate session_token if provided (for STS Login)
    if let Some(token) = session_token {
        if !token.is_empty() {
            // Use the same logic as auth::check_claims_from_token
            // For STS Login, we validate the token but don't require it to match exactly
            // since we're using AssumeRole flow
            let claims = crate::auth::check_claims_from_token(token, &cred)
                .map_err(|e| S3Error::with_message(S3ErrorCode::InternalError, format!("check claims failed {e}")))?;
            
            cred.claims = if !claims.is_empty() { Some(claims) } else { None };
        }
    }

    Ok(cred)
}
