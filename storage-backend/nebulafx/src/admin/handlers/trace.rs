use http::StatusCode;
use hyper::Uri;
use matchit::Params;
use nebulafx_ecstore::{GLOBAL_Endpoints, rpc::PeerRestClient};
use nebulafx_madmin::service_commands::ServiceTraceOpts;
use s3s::{Body, S3Request, S3Response, S3Result, s3_error};
use tracing::warn;

use crate::admin::router::Operation;

#[allow(dead_code)]
fn extract_trace_options(uri: &Uri) -> S3Result<ServiceTraceOpts> {
    let mut st_opts = ServiceTraceOpts::default();
    st_opts
        .parse_params(uri)
        .map_err(|_| s3_error!(InvalidRequest, "invalid params"))?;

    Ok(st_opts)
}

#[allow(dead_code)]
pub struct Trace {}

#[async_trait::async_trait]
impl Operation for Trace {
    async fn call(&self, req: S3Request<Body>, _params: Params<'_, '_>) -> S3Result<S3Response<(StatusCode, Body)>> {
        warn!("handle Trace");

        let _trace_opts = extract_trace_options(&req.uri)?;

        // let (tx, rx) = mpsc::channel(10000);
        let _peers = match GLOBAL_Endpoints.get() {
            Some(ep) => PeerRestClient::new_clients(ep.clone()).await,
            None => (Vec::new(), Vec::new()),
        };
        Err(s3_error!(NotImplemented))
    }
}
