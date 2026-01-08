

use crate::LoggingGuard;
use std::sync::{Arc, Mutex};
use tokio::sync::SetError;

/// Error type for global guard operations
#[derive(Debug, thiserror::Error)]
pub enum GlobalError {
    #[error("Failed to set global guard: {0}")]
    SetError(#[from] SetError<Arc<Mutex<LoggingGuard>>>),
    #[error("Global guard not initialized")]
    NotInitialized,
    #[error("Failed to send log: {0}")]
    SendFailed(&'static str),
    #[error("Operation timed out: {0}")]
    Timeout(&'static str),
    #[error("Telemetry initialization failed: {0}")]
    TelemetryError(#[from] TelemetryError),
}

#[derive(Debug, thiserror::Error)]
pub enum TelemetryError {
    #[error("Tracing subscriber init failed: {0}")]
    SubscriberInit(String),
    #[error("I/O error: {0}")]
    Io(String),
    #[error("Set permissions failed: {0}")]
    SetPermissions(String),
}

impl From<std::io::Error> for TelemetryError {
    fn from(e: std::io::Error) -> Self {
        TelemetryError::Io(e.to_string())
    }
}
