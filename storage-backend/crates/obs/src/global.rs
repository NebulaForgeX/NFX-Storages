

use crate::{GlobalError, ObservabilityConfig, LoggingGuard, telemetry::init_telemetry};
use std::fmt;
use std::sync::{Arc, Mutex};
use tokio::sync::OnceCell;

/// Global guard for logging system
static GLOBAL_GUARD: OnceCell<Arc<Mutex<LoggingGuard>>> = OnceCell::const_new();

pub struct Success;

impl fmt::Display for Success {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "Success")
    }
}
/// Initialize the observability module
///
/// This function initializes the logging system and stores the guard globally,
/// similar to how `init_config` works. The guard is automatically stored in
/// the global static variable for later access via `get_global_guard()`.
///
/// # Arguments
/// * `config` - The observability configuration
///
/// # Returns
/// * `Ok(())` if successful
/// * `Err(GlobalError)` if initialization or setting fails
///
/// # Example
/// ```no_run
/// # use nebulafx_obs::{init_obs, ObservabilityConfig};
///
/// # fn main() {
/// #    let config = ObservabilityConfig::default();
/// #    match init_obs(config) {
/// #         Ok(_) => {}
/// #         Err(e) => { eprintln!("Failed to initialize observability: {}", e); }
/// #     }
/// # }
/// ```
pub fn init_obs(config: Option<&ObservabilityConfig>) -> Result<Success, GlobalError> {
    let config = config.cloned().unwrap_or_default();
    let logging_guard = init_telemetry(&config)?;
    // Store in global storage automatically
    GLOBAL_GUARD.set(Arc::new(Mutex::new(logging_guard))).map_err(GlobalError::SetError)?;
    Ok(Success)
}

/// Set the global guard for logging system
///
/// # Arguments
/// * `guard` - The LoggingGuard instance to set globally
///
/// # Returns
/// * `Ok(())` if successful
/// * `Err(GuardError)` if setting fails
///
/// # Example
/// ```no_run
/// # use nebulafx_obs::{ init_obs, set_global_guard};
///
/// # fn init() -> Result<(), Box<dyn std::error::Error>> {
/// #    let guard = match init_obs(ObservabilityConfig::default()){
/// #         Ok(g) => g,
/// #         Err(e) => { return Err(Box::new(e)); }
/// #    };
/// #    set_global_guard(guard)?;
/// #    Ok(())
/// # }
/// ```
pub fn set_global_guard(guard: LoggingGuard) -> Result<Success, GlobalError> {
    GLOBAL_GUARD.set(Arc::new(Mutex::new(guard))).map_err(GlobalError::SetError)?;
    Ok(Success)
}

/// Get the global guard for logging system
///
/// # Returns
/// * `Ok(Arc<Mutex<LoggingGuard>>)` if guard exists
/// * `Err(GuardError)` if guard not initialized
///
/// # Example
/// ```no_run
/// # use nebulafx_obs::get_global_guard;
///
/// # async fn logging_operation() -> Result<(), Box<dyn std::error::Error>> {
/// #    let guard = get_global_guard()?;
/// #    let _lock = guard.lock().unwrap();
/// #    // Perform logging operation
/// #    Ok(())
/// # }
/// ```
pub fn get_global_guard() -> Result<Arc<Mutex<LoggingGuard>>, GlobalError> {
    GLOBAL_GUARD.get().cloned().ok_or(GlobalError::NotInitialized)
}

#[cfg(test)]
mod tests {
    use super::*;
    #[tokio::test]
    async fn test_get_uninitialized_guard() {
        let result = get_global_guard();
        assert!(matches!(result, Err(GlobalError::NotInitialized)));
    }
}
