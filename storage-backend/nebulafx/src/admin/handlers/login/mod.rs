mod key_login;
mod sts_login;
mod common;
mod error;

use crate::admin::router::Operation;
use http::StatusCode;
use matchit::Params;
use s3s::{Body, S3Error, S3ErrorCode, S3Request, S3Response, S3Result};
use crate::auth::get_session_token;

use key_login::handle_key_login;
use sts_login::handle_sts_login;
use common::parse_assume_role_request;

/// Main login handler that dispatches to KeyLogin or StsLogin based on request
/// This is the only public interface for login functionality
pub struct LoginHandle {}

#[async_trait::async_trait]
impl Operation for LoginHandle {
    async fn call(&self, req: S3Request<Body>, _params: Params<'_, '_>) -> S3Result<S3Response<(StatusCode, Body)>> {
        let body = parse_assume_role_request(req.input).await?;
        let session_token = get_session_token(&req.uri, &req.headers);
        
        // Extract credentials
        let Some(user) = req.credentials else { 
            return Err(S3Error::with_message(S3ErrorCode::InvalidRequest, error::messages::GET_CRED_FAILED)) 
        };

        // Route to appropriate handler based on session_token presence
        if let Some(token) = session_token {
            // STS Login: requires session_token
            handle_sts_login(&user.access_key, body, Some(token)).await
        } else {
            // Key Login: only needs access_key, no session_token
            handle_key_login(&user.access_key, body).await
        }
    }
}