use http::HeaderMap;
use http::Uri;
use nebulafx_ecstore::global::get_global_action_cred;
use nebulafx_iamx::error::Error as IamError;
use nebulafx_iamx::sys::SESSION_POLICY_NAME;
use nebulafx_iamx::sys::get_claims_from_token_with_secret;
use nebulafx_policy::auth;
use nebulafx_utils::http::ip::get_source_ip_raw;
use s3s::S3Error;
use s3s::S3ErrorCode;
use s3s::S3Result;
use s3s::auth::S3Auth;
use s3s::auth::SecretKey;
use s3s::auth::SimpleAuth;
use s3s::s3_error;
use serde_json::Value;
use std::collections::HashMap;
use time::OffsetDateTime;
use time::format_description::well_known::Rfc3339;

// Authentication type constants
const JWT_ALGORITHM: &str = "Bearer ";
const SIGN_V2_ALGORITHM: &str = "AWS ";
const SIGN_V4_ALGORITHM: &str = "AWS4-HMAC-SHA256";
const STREAMING_CONTENT_SHA256: &str = "STREAMING-AWS4-HMAC-SHA256-PAYLOAD";
const STREAMING_CONTENT_SHA256_TRAILER: &str = "STREAMING-AWS4-HMAC-SHA256-PAYLOAD-TRAILER";
pub const UNSIGNED_PAYLOAD_TRAILER: &str = "STREAMING-UNSIGNED-PAYLOAD-TRAILER";
const ACTION_HEADER: &str = "Action";
const AMZ_CREDENTIAL: &str = "X-Amz-Credential";
const AMZ_ACCESS_KEY_ID: &str = "AWSAccessKeyId";
pub const UNSIGNED_PAYLOAD: &str = "UNSIGNED-PAYLOAD";

// Authentication type enum
#[derive(Debug, Clone, PartialEq, Eq, Default)]
pub enum AuthType {
    #[default]
    Unknown,
    Anonymous,
    Presigned,
    PresignedV2,
    PostPolicy,
    StreamingSigned,
    Signed,
    SignedV2,
    #[allow(clippy::upper_case_acronyms)]
    JWT,
    #[allow(clippy::upper_case_acronyms)]
    STS,
    StreamingSignedTrailer,
    StreamingUnsignedTrailer,
}

pub struct IAMAuth {
    simple_auth: SimpleAuth,
}

impl IAMAuth {
    pub fn new(ak: impl Into<String>, sk: impl Into<SecretKey>) -> Self {
        let simple_auth = SimpleAuth::from_single(ak, sk);
        Self { simple_auth }
    }
}

#[async_trait::async_trait]
impl S3Auth for IAMAuth {
    async fn get_secret_key(&self, access_key: &str) -> S3Result<SecretKey> {
        if access_key.is_empty() {
            return Err(s3_error!(UnauthorizedAccess, "Your account is not signed up"));
        }

        if let Ok(key) = self.simple_auth.get_secret_key(access_key).await {
            return Ok(key);
        }

        if let Ok(iam_store) = nebulafx_iamx::get() {
            if let Some(id) = iam_store.get_user(access_key).await {
                return Ok(SecretKey::from(id.credentials.secret_key.clone()));
            }
        }

        Err(s3_error!(UnauthorizedAccess, "Your account is not signed up2"))
    }
}

// check_key_valid checks the key is valid or not. return the user's credentials and if the user is the owner.
pub async fn check_key_valid(session_token: &str, access_key: &str) -> S3Result<(auth::Credentials, bool)> {
    let Some(mut cred) = get_global_action_cred() else {
        return Err(S3Error::with_message(
            S3ErrorCode::InternalError,
            format!("get_global_action_cred {:?}", IamError::IamSysNotInitialized),
        ));
    };

    let sys_cred = cred.clone();

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
            .map_err(|e| S3Error::with_message(S3ErrorCode::InternalError, format!("check claims failed1 {e}")))?;

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

    let claims = check_claims_from_token(session_token, &cred)
        .map_err(|e| S3Error::with_message(S3ErrorCode::InternalError, format!("check claims failed {e}")))?;

    cred.claims = if !claims.is_empty() { Some(claims) } else { None };

    let mut owner = sys_cred.access_key == cred.access_key || cred.parent_user == sys_cred.access_key;

    // permitRootAccess
    if let Some(claims) = &cred.claims {
        if claims.contains_key(SESSION_POLICY_NAME) {
            owner = false
        }
    }

    Ok((cred, owner))
}

pub fn check_claims_from_token(token: &str, cred: &auth::Credentials) -> S3Result<HashMap<String, Value>> {
    if !token.is_empty() && cred.access_key.is_empty() {
        return Err(s3_error!(InvalidRequest, "no access key"));
    }

    if token.is_empty() && cred.is_temp() && !cred.is_service_account() {
        return Err(s3_error!(InvalidRequest, "invalid token1"));
    }

    if !token.is_empty() && !cred.is_temp() {
        return Err(s3_error!(InvalidRequest, "invalid token2"));
    }

    if !cred.is_service_account() && cred.is_temp() && token != cred.session_token {
        return Err(s3_error!(InvalidRequest, "invalid token3"));
    }

    if cred.is_temp() && cred.is_expired() {
        return Err(s3_error!(InvalidRequest, "invalid access key is temp and expired"));
    }

    let Some(sys_cred) = get_global_action_cred() else {
        return Err(s3_error!(InternalError, "action cred not init"));
    };

    // TODO: REPLICATION

    let (token, secret) = if cred.is_service_account() {
        (cred.session_token.as_str(), cred.secret_key.as_str())
    } else {
        (token, sys_cred.secret_key.as_str())
    };

    if !token.is_empty() {
        let claims: HashMap<String, Value> =
            get_claims_from_token_with_secret(token, secret).map_err(|_e| s3_error!(InvalidRequest, "invalid token"))?;
        return Ok(claims);
    }

    Ok(HashMap::new())
}

pub fn get_session_token<'a>(uri: &'a Uri, hds: &'a HeaderMap) -> Option<&'a str> {
    hds.get("x-amz-security-token")
        .map(|v| v.to_str().unwrap_or_default())
        .or_else(|| get_query_param(uri.query().unwrap_or_default(), "x-amz-security-token"))
}

pub fn get_condition_values(
    header: &HeaderMap,
    cred: &auth::Credentials,
    version_id: Option<&str>,
    region: Option<&str>,
) -> HashMap<String, Vec<String>> {
    let username = if cred.is_temp() || cred.is_service_account() {
        cred.parent_user.clone()
    } else {
        cred.access_key.clone()
    };

    let sys_cred = get_global_action_cred().unwrap_or_default();

    let claims = &cred.claims;

    let principal_type = if !username.is_empty() {
        if claims.is_some() {
            "AssumedRole"
        } else if sys_cred.access_key == username {
            "Account"
        } else {
            "User"
        }
    } else {
        "Anonymous"
    };

    // Get current time
    let curr_time = OffsetDateTime::now_utc();
    let epoch_time = curr_time.unix_timestamp();

    // Use provided version ID or empty string
    let vid = version_id.unwrap_or("");

    // Determine auth type and signature version from headers
    let (auth_type, signature_version) = determine_auth_type_and_version(header);

    // Get TLS status from header
    let is_tls = header
        .get("x-forwarded-proto")
        .and_then(|v| v.to_str().ok())
        .map(|s| s == "https")
        .or_else(|| {
            header
                .get("x-forwarded-scheme")
                .and_then(|v| v.to_str().ok())
                .map(|s| s == "https")
        })
        .unwrap_or(false);

    // Get remote address from header or use default
    let remote_addr = header
        .get("x-forwarded-for")
        .and_then(|v| v.to_str().ok())
        .and_then(|s| s.split(',').next())
        .or_else(|| header.get("x-real-ip").and_then(|v| v.to_str().ok()))
        .unwrap_or("127.0.0.1");

    let mut args = HashMap::new();

    // Add basic time and security info
    args.insert("CurrentTime".to_owned(), vec![curr_time.format(&Rfc3339).unwrap_or_default()]);
    args.insert("EpochTime".to_owned(), vec![epoch_time.to_string()]);
    args.insert("SecureTransport".to_owned(), vec![is_tls.to_string()]);
    args.insert("SourceIp".to_owned(), vec![get_source_ip_raw(header, remote_addr)]);

    // Add user agent and referer
    if let Some(user_agent) = header.get("user-agent") {
        args.insert("UserAgent".to_owned(), vec![user_agent.to_str().unwrap_or("").to_string()]);
    }
    if let Some(referer) = header.get("referer") {
        args.insert("Referer".to_owned(), vec![referer.to_str().unwrap_or("").to_string()]);
    }

    // Add user and principal info
    args.insert("userid".to_owned(), vec![username.clone()]);
    args.insert("username".to_owned(), vec![username]);
    args.insert("principaltype".to_owned(), vec![principal_type.to_string()]);

    // Add version ID
    if !vid.is_empty() {
        args.insert("versionid".to_owned(), vec![vid.to_string()]);
    }

    // Add signature version and auth type
    if !signature_version.is_empty() {
        args.insert("signatureversion".to_owned(), vec![signature_version]);
    }
    if !auth_type.is_empty() {
        args.insert("authType".to_owned(), vec![auth_type]);
    }

    if let Some(lc) = region {
        if !lc.is_empty() {
            args.insert("LocationConstraint".to_owned(), vec![lc.to_string()]);
        }
    }

    let mut clone_header = header.clone();
    if let Some(v) = clone_header.get("x-amz-signature-age") {
        args.insert("signatureAge".to_string(), vec![v.to_str().unwrap_or("").to_string()]);
        clone_header.remove("x-amz-signature-age");
    }

    for obj_lock in &[
        "x-amz-object-lock-mode",
        "x-amz-object-lock-legal-hold",
        "x-amz-object-lock-retain-until-date",
    ] {
        let values = clone_header
            .get_all(*obj_lock)
            .iter()
            .map(|v| v.to_str().unwrap_or("").to_string())
            .collect::<Vec<String>>();
        if !values.is_empty() {
            args.insert(obj_lock.trim_start_matches("x-amz-").to_string(), values);
        }
        clone_header.remove(*obj_lock);
    }

    for (key, _values) in clone_header.iter() {
        if key.as_str().eq_ignore_ascii_case("x-amz-tagging") {
            continue;
        }
        if let Some(existing_values) = args.get_mut(key.as_str()) {
            existing_values.extend(clone_header.get_all(key).iter().map(|v| v.to_str().unwrap_or("").to_string()));
        } else {
            args.insert(
                key.as_str().to_string(),
                header
                    .get_all(key)
                    .iter()
                    .map(|v| v.to_str().unwrap_or("").to_string())
                    .collect(),
            );
        }
    }

    if let Some(claims) = &cred.claims {
        for (k, v) in claims {
            if let Some(v_str) = v.as_str() {
                args.insert(k.trim_start_matches("ldap").to_lowercase(), vec![v_str.to_string()]);
            }
        }

        if let Some(grps_val) = claims.get("groups") {
            if let Some(grps_is) = grps_val.as_array() {
                let grps = grps_is
                    .iter()
                    .filter_map(|g| g.as_str().map(|s| s.to_string()))
                    .collect::<Vec<String>>();
                if !grps.is_empty() {
                    args.insert("groups".to_string(), grps);
                }
            }
        }
    }

    if let Some(groups) = &cred.groups {
        if !args.contains_key("groups") {
            args.insert("groups".to_string(), groups.clone());
        }
    }

    args
}

// Get request authentication type
pub fn get_request_auth_type(header: &HeaderMap) -> AuthType {
    if is_request_signature_v2(header) {
        AuthType::SignedV2
    } else if is_request_presigned_signature_v2(header) {
        AuthType::PresignedV2
    } else if is_request_sign_streaming_v4(header) {
        AuthType::StreamingSigned
    } else if is_request_sign_streaming_trailer_v4(header) {
        AuthType::StreamingSignedTrailer
    } else if is_request_unsigned_trailer_v4(header) {
        AuthType::StreamingUnsignedTrailer
    } else if is_request_signature_v4(header) {
        AuthType::Signed
    } else if is_request_presigned_signature_v4(header) {
        AuthType::Presigned
    } else if is_request_jwt(header) {
        AuthType::JWT
    } else if is_request_post_policy_signature_v4(header) {
        AuthType::PostPolicy
    } else if is_request_sts(header) {
        AuthType::STS
    } else if is_request_anonymous(header) {
        AuthType::Anonymous
    } else {
        AuthType::Unknown
    }
}

// Helper function to determine auth type and signature version
fn determine_auth_type_and_version(header: &HeaderMap) -> (String, String) {
    match get_request_auth_type(header) {
        AuthType::JWT => ("JWT".to_string(), String::new()),
        AuthType::SignedV2 => ("REST-HEADER".to_string(), "AWS2".to_string()),
        AuthType::PresignedV2 => ("REST-QUERY-STRING".to_string(), "AWS2".to_string()),
        AuthType::StreamingSigned | AuthType::StreamingSignedTrailer | AuthType::StreamingUnsignedTrailer => {
            ("REST-HEADER".to_string(), "AWS4-HMAC-SHA256".to_string())
        }
        AuthType::Signed => ("REST-HEADER".to_string(), "AWS4-HMAC-SHA256".to_string()),
        AuthType::Presigned => ("REST-QUERY-STRING".to_string(), "AWS4-HMAC-SHA256".to_string()),
        AuthType::PostPolicy => ("POST".to_string(), String::new()),
        AuthType::STS => ("STS".to_string(), String::new()),
        AuthType::Anonymous => ("Anonymous".to_string(), String::new()),
        AuthType::Unknown => (String::new(), String::new()),
    }
}

// Verify if request has JWT
fn is_request_jwt(header: &HeaderMap) -> bool {
    if let Some(auth) = header.get("authorization") {
        if let Ok(auth_str) = auth.to_str() {
            return auth_str.starts_with(JWT_ALGORITHM);
        }
    }
    false
}

// Verify if request has AWS Signature Version '4'
fn is_request_signature_v4(header: &HeaderMap) -> bool {
    if let Some(auth) = header.get("authorization") {
        if let Ok(auth_str) = auth.to_str() {
            return auth_str.starts_with(SIGN_V4_ALGORITHM);
        }
    }
    false
}

// Verify if request has AWS Signature Version '2'
fn is_request_signature_v2(header: &HeaderMap) -> bool {
    if let Some(auth) = header.get("authorization") {
        if let Ok(auth_str) = auth.to_str() {
            return !auth_str.starts_with(SIGN_V4_ALGORITHM) && auth_str.starts_with(SIGN_V2_ALGORITHM);
        }
    }
    false
}

// Verify if request has AWS PreSign Version '4'
pub(crate) fn is_request_presigned_signature_v4(header: &HeaderMap) -> bool {
    if let Some(credential) = header.get(AMZ_CREDENTIAL) {
        return !credential.to_str().unwrap_or("").is_empty();
    }
    false
}

// Verify request has AWS PreSign Version '2'
fn is_request_presigned_signature_v2(header: &HeaderMap) -> bool {
    if let Some(access_key) = header.get(AMZ_ACCESS_KEY_ID) {
        return !access_key.to_str().unwrap_or("").is_empty();
    }
    false
}

// Verify if request has AWS Post policy Signature Version '4'
fn is_request_post_policy_signature_v4(header: &HeaderMap) -> bool {
    if let Some(content_type) = header.get("content-type") {
        if let Ok(ct) = content_type.to_str() {
            return ct.contains("multipart/form-data");
        }
    }
    false
}

// Verify if the request has AWS Streaming Signature Version '4'
fn is_request_sign_streaming_v4(header: &HeaderMap) -> bool {
    if let Some(content_sha256) = header.get("x-amz-content-sha256") {
        if let Ok(sha256_str) = content_sha256.to_str() {
            return sha256_str == STREAMING_CONTENT_SHA256;
        }
    }
    false
}

// Verify if the request has AWS Streaming Signature Version '4' with trailer
fn is_request_sign_streaming_trailer_v4(header: &HeaderMap) -> bool {
    if let Some(content_sha256) = header.get("x-amz-content-sha256") {
        if let Ok(sha256_str) = content_sha256.to_str() {
            return sha256_str == STREAMING_CONTENT_SHA256_TRAILER;
        }
    }
    false
}

// Verify if the request has AWS Streaming Signature Version '4' with unsigned content and trailer
fn is_request_unsigned_trailer_v4(header: &HeaderMap) -> bool {
    if let Some(content_sha256) = header.get("x-amz-content-sha256") {
        if let Ok(sha256_str) = content_sha256.to_str() {
            return sha256_str == UNSIGNED_PAYLOAD_TRAILER;
        }
    }
    false
}

// Verify if request is STS (Security Token Service)
fn is_request_sts(header: &HeaderMap) -> bool {
    if let Some(action) = header.get(ACTION_HEADER) {
        return !action.to_str().unwrap_or("").is_empty();
    }
    false
}

// Verify if request is anonymous
fn is_request_anonymous(header: &HeaderMap) -> bool {
    header.get("authorization").is_none()
}

pub fn get_query_param<'a>(query: &'a str, param_name: &str) -> Option<&'a str> {
    let param_name = param_name.to_lowercase();

    for pair in query.split('&') {
        let mut parts = pair.splitn(2, '=');
        if let (Some(key), Some(value)) = (parts.next(), parts.next()) {
            if key.to_lowercase() == param_name {
                return Some(value);
            }
        }
    }
    None
}
