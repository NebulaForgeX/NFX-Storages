use http::StatusCode;
use nebulafx_ecstore::bucket::utils::serialize;
use nebulafx_iamx::sys::SESSION_POLICY_NAME;
use nebulafx_policy::{auth::Credentials as PolicyCredentials, policy::Policy};
use s3s::{
    Body, S3Error, S3ErrorCode, S3Response, S3Result,
    dto::{AssumeRoleOutput, Credentials, Timestamp},
};
use super::error::messages;
use serde::Deserialize;
use serde_json::Value;
use serde_urlencoded::from_bytes;
use std::collections::HashMap;
use time::{Duration, OffsetDateTime};
use tracing::warn;

pub const ASSUME_ROLE_ACTION: &str = "AssumeRole";
pub const ASSUME_ROLE_VERSION: &str = "2011-06-15";

#[derive(Deserialize, Debug, Default, Clone)]
#[serde(rename_all = "PascalCase", default)]
pub struct AssumeRoleRequest {
    pub action: String,
    pub duration_seconds: usize,
    pub version: String,
    pub role_arn: String,
    pub role_session_name: String,
    pub policy: String,
    pub external_id: String,
}

/// Parse and validate the request body for AssumeRole
pub async fn parse_assume_role_request(mut input: Body) -> S3Result<AssumeRoleRequest> {
    // Read request body
    let bytes = match input.store_all_unlimited().await {
        Ok(b) => b,
        Err(e) => {
            warn!("get body failed, e: {:?}", e);
            return Err(S3Error::with_message(S3ErrorCode::InvalidRequest, messages::GET_BODY_FAILED));
        }
    };

    // Parse request body
    let body: AssumeRoleRequest = from_bytes(&bytes)
        .map_err(|_e| S3Error::with_message(S3ErrorCode::InvalidRequest, messages::GET_BODY_FAILED))?;

    // Validate action and version
    if body.action.as_str() != ASSUME_ROLE_ACTION {
        return Err(S3Error::with_message(S3ErrorCode::InvalidArgument, messages::NOT_SUPPORT_ACTION));
    }

    if body.version.as_str() != ASSUME_ROLE_VERSION {
        return Err(S3Error::with_message(S3ErrorCode::InvalidArgument, messages::NOT_SUPPORT_VERSION));
    }

    Ok(body)
}

/// Build claims for AssumeRole response
/// This includes session policy, expiration, and parent user information
pub fn build_claims(
    existing_claims: Option<HashMap<String, Value>>,
    policy: &str,
    duration_seconds: usize,
    parent_access_key: &str,
) -> S3Result<HashMap<String, Value>> {
    let mut claims = existing_claims.unwrap_or_default();
    
    // Populate session policy
    populate_session_policy(&mut claims, policy)?;
    
    // Calculate expiration
    let exp = if duration_seconds > 0 {
        duration_seconds
    } else {
        3600
    };
    
    // Set expiration timestamp
    claims.insert(
        "exp".to_string(),
        Value::Number(serde_json::Number::from(OffsetDateTime::now_utc().unix_timestamp() + exp as i64)),
    );
    
    // Set parent user
    claims.insert("parent".to_string(), Value::String(parent_access_key.to_string()));
    
    Ok(claims)
}

/// Populate session policy into claims
pub fn populate_session_policy(claims: &mut HashMap<String, Value>, policy: &str) -> S3Result<()> {
    if !policy.is_empty() {
        let session_policy = Policy::parse_config(policy.as_bytes())
            .map_err(|e| S3Error::with_message(S3ErrorCode::InternalError, format!("{} {}", messages::PARSE_POLICY_ERR, e)))?;
        if session_policy.version.is_empty() {
            return Err(S3Error::with_message(S3ErrorCode::InvalidRequest, messages::INVALID_POLICY));
        }

        let policy_buf = serde_json::to_vec(&session_policy)
            .map_err(|e| S3Error::with_message(S3ErrorCode::InternalError, format!("{} {}", messages::MARSHAL_POLICY_ERR, e)))?;

        if policy_buf.len() > 2048 {
            return Err(S3Error::with_message(S3ErrorCode::InvalidRequest, messages::POLICY_TOO_LARGE));
        }

        claims.insert(
            SESSION_POLICY_NAME.to_string(),
            Value::String(base64_simd::URL_SAFE_NO_PAD.encode_to_string(&policy_buf)),
        );
    }

    Ok(())
}

/// Build AssumeRole response from temporary credentials
pub fn build_assume_role_response(new_cred: &PolicyCredentials) -> S3Response<(StatusCode, Body)> {
    let resp = AssumeRoleOutput {
        credentials: Some(Credentials {
            access_key_id: new_cred.access_key.clone(),
            expiration: Timestamp::from(
                new_cred
                    .expiration
                    .unwrap_or(OffsetDateTime::now_utc().saturating_add(Duration::seconds(3600))),
            ),
            secret_access_key: new_cred.secret_key.clone(),
            session_token: new_cred.session_token.clone(),
        }),
        ..Default::default()
    };

    let output = serialize::<AssumeRoleOutput>(&resp).unwrap();

    S3Response::new((StatusCode::OK, Body::from(output)))
}

