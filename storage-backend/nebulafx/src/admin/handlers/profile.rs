use crate::admin::router::Operation;
use http::header::CONTENT_TYPE;
use http::{HeaderMap, StatusCode};
use matchit::Params;
use s3s::{Body, S3Request, S3Response, S3Result};
use tracing::info;

pub struct TriggerProfileCPU {}
#[async_trait::async_trait]
impl Operation for TriggerProfileCPU {
    async fn call(&self, _req: S3Request<Body>, _params: Params<'_, '_>) -> S3Result<S3Response<(StatusCode, Body)>> {
        info!("Triggering CPU profile dump via S3 request...");
        #[cfg(target_os = "windows")]
        {
            let mut header = HeaderMap::new();
            header.insert(CONTENT_TYPE, "text/plain".parse().unwrap());
            return Ok(S3Response::with_headers(
                (
                    StatusCode::NOT_IMPLEMENTED,
                    Body::from("CPU profiling is not supported on Windows".to_string()),
                ),
                header,
            ));
        }

        #[cfg(not(target_os = "windows"))]
        {
            use nebulafx_profilingx::dump_cpu_pprof_for;
            use crate::config::get_config;
            let dur = std::time::Duration::from_secs(60);
            let profiling_config = get_config().profiling.clone().unwrap_or_default();
            match dump_cpu_pprof_for(&profiling_config, dur).await {
                Ok(path) => {
                    let mut header = HeaderMap::new();
                    header.insert(CONTENT_TYPE, "text/html".parse().unwrap());
                    Ok(S3Response::with_headers((StatusCode::OK, Body::from(path.display().to_string())), header))
                }
                Err(e) => Err(s3s::s3_error!(InternalError, "{}", format!("Failed to dump CPU profile: {e}"))),
            }
        }
    }
}

pub struct TriggerProfileMemory {}
#[async_trait::async_trait]
impl Operation for TriggerProfileMemory {
    async fn call(&self, _req: S3Request<Body>, _params: Params<'_, '_>) -> S3Result<S3Response<(StatusCode, Body)>> {
        info!("Triggering Memory profile dump via S3 request...");
        #[cfg(target_os = "windows")]
        {
            let mut header = HeaderMap::new();
            header.insert(CONTENT_TYPE, "text/plain".parse().unwrap());
            return Ok(S3Response::with_headers(
                (
                    StatusCode::NOT_IMPLEMENTED,
                    Body::from("Memory profiling is not supported on Windows".to_string()),
                ),
                header,
            ));
        }

        #[cfg(not(target_os = "windows"))]
        {
            use nebulafx_profilingx::dump_memory_pprof_now;
            use crate::config::get_config;
            let profiling_config = get_config().profiling.clone().unwrap_or_default();
            match dump_memory_pprof_now(&profiling_config).await {
                Ok(path) => {
                    let mut header = HeaderMap::new();
                    header.insert(CONTENT_TYPE, "text/html".parse().unwrap());
                    Ok(S3Response::with_headers((StatusCode::OK, Body::from(path.display().to_string())), header))
                }
                Err(e) => Err(s3s::s3_error!(InternalError, "{}", format!("Failed to dump Memory profile: {e}"))),
            }
        }
    }
}
