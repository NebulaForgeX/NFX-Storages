

use serde::{Deserialize, Serialize};

// Default values for observability configuration
pub const DEFAULT_APP_NAME: &str = "NebulaFX";
pub const DEFAULT_LOG_LEVEL: &str = "error";
pub const DEFAULT_ENVIRONMENT: &str = "production";
pub const DEFAULT_ENVIRONMENT_PRODUCTION: &str = "production";
pub const DEFAULT_LOG_KEEP_FILES: usize = 30;
pub const DEFAULT_OBS_LOG_STDOUT_ENABLED: bool = false;

// Default values for async logging
pub const DEFAULT_OBS_LOG_POOL_CAPA: usize = 10240;
pub const DEFAULT_OBS_LOG_MESSAGE_CAPA: usize = 32768;
pub const DEFAULT_OBS_LOG_FLUSH_MS: u64 = 200;

/// Observability configuration
///
/// This struct defines all configuration options for the observability system,
/// including logging settings, service metadata, and log rotation parameters.
///
/// # Example
/// ```no_run
/// use nebulafx_obs::ObservabilityConfig;
///
/// let config = ObservabilityConfig::new();
/// ```
#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct ObservabilityConfig {
    pub use_stdout: Option<bool>,         // Output to stdout
    pub service_name: Option<String>,     // Service name
    pub service_version: Option<String>,  // Service version
    pub environment: Option<String>,      // Environment (production/development/test/staging)
    pub logger_level: Option<String>,     // Logger level (trace/debug/info/warn/error)
    pub log_stdout_enabled: Option<bool>, // Stdout logging enabled
    // File logging configurations
    pub log_directory: Option<String>,     // Log file directory
    pub log_filename: Option<String>,      // Log file name
    pub log_rotation_size_mb: Option<u64>, // Log file size rotation threshold (MB)
    pub log_rotation_time: Option<String>, // Log rotation time (hour/day/minute/second)
    pub log_keep_files: Option<u32>,       // Number of log files to keep
    // Async logging configurations
    pub log_pool_capa: Option<usize>,      // Log pool capacity for async logging
    pub log_message_capa: Option<usize>,   // Maximum message capacity for async logging
    pub log_flush_ms: Option<u64>,         // Log flush interval in milliseconds
    // Output format configurations
    pub log_json: Option<bool>,            // Whether to use JSON format for log output
}

impl ObservabilityConfig {
    /// Create a new instance of ObservabilityConfig with default values
    ///
    /// # Returns
    /// A new instance of ObservabilityConfig
    ///
    /// # Example
    /// ```no_run
    /// use nebulafx_obs::ObservabilityConfig;
    ///
    /// let config = ObservabilityConfig::new();
    /// ```
    pub fn new() -> Self {
        Self {
            use_stdout: None,
            service_name: None,
            service_version: None,
            environment: None,
            logger_level: None,
            log_stdout_enabled: None,
            log_directory: None,
            log_filename: None,
            log_rotation_size_mb: None,
            log_rotation_time: None,
            log_keep_files: None,
            log_pool_capa: None,
            log_message_capa: None,
            log_flush_ms: None,
            log_json: None,
        }
    }
}

/// Implement Default trait for ObservabilityConfig
/// This allows creating a default instance of ObservabilityConfig using ObservabilityConfig::default()
/// which internally calls ObservabilityConfig::new()
///
/// # Example
/// ```no_run
/// use nebulafx_obs::ObservabilityConfig;
///
/// let config = ObservabilityConfig::default();
/// ```
/// let unwrap_or_default() = unwrap_or_else(|| ObservabilityConfig::new())
impl Default for ObservabilityConfig {
    fn default() -> Self {
        Self::new()
    }
}

/// Check if the given environment string is production
///
/// # Arguments
/// * `environment` - The environment string to check
///
/// # Returns
/// true if production, false otherwise
pub fn is_production_environment(environment: &str) -> bool {
    environment.eq_ignore_ascii_case(DEFAULT_ENVIRONMENT_PRODUCTION)
}



