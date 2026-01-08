

// Observability Keys

mod metrics;
pub use metrics::*;

pub const ENV_OBS_ENDPOINT: &str = "NEUBULAFX_OBS_ENDPOINT";
pub const ENV_OBS_TRACE_ENDPOINT: &str = "NEUBULAFX_OBS_TRACE_ENDPOINT";
pub const ENV_OBS_METRIC_ENDPOINT: &str = "NEUBULAFX_OBS_METRIC_ENDPOINT";
pub const ENV_OBS_LOG_ENDPOINT: &str = "NEUBULAFX_OBS_LOG_ENDPOINT";
pub const ENV_OBS_USE_STDOUT: &str = "NEUBULAFX_OBS_USE_STDOUT";
pub const ENV_OBS_SAMPLE_RATIO: &str = "NEUBULAFX_OBS_SAMPLE_RATIO";
pub const ENV_OBS_METER_INTERVAL: &str = "NEUBULAFX_OBS_METER_INTERVAL";
pub const ENV_OBS_SERVICE_NAME: &str = "NEUBULAFX_OBS_SERVICE_NAME";
pub const ENV_OBS_SERVICE_VERSION: &str = "NEUBULAFX_OBS_SERVICE_VERSION";
pub const ENV_OBS_ENVIRONMENT: &str = "NEUBULAFX_OBS_ENVIRONMENT";
pub const ENV_OBS_LOGGER_LEVEL: &str = "NEUBULAFX_OBS_LOGGER_LEVEL";
pub const ENV_OBS_LOG_STDOUT_ENABLED: &str = "NEUBULAFX_OBS_LOG_STDOUT_ENABLED";
pub const ENV_OBS_LOG_DIRECTORY: &str = "NEUBULAFX_OBS_LOG_DIRECTORY";
pub const ENV_OBS_LOG_FILENAME: &str = "NEUBULAFX_OBS_LOG_FILENAME";
pub const ENV_OBS_LOG_ROTATION_SIZE_MB: &str = "NEUBULAFX_OBS_LOG_ROTATION_SIZE_MB";
pub const ENV_OBS_LOG_ROTATION_TIME: &str = "NEUBULAFX_OBS_LOG_ROTATION_TIME";
pub const ENV_OBS_LOG_KEEP_FILES: &str = "NEUBULAFX_OBS_LOG_KEEP_FILES";

/// Log pool capacity for async logging
pub const ENV_OBS_LOG_POOL_CAPA: &str = "NEUBULAFX_OBS_LOG_POOL_CAPA";

/// Log message capacity for async logging
pub const ENV_OBS_LOG_MESSAGE_CAPA: &str = "NEUBULAFX_OBS_LOG_MESSAGE_CAPA";

/// Log flush interval in milliseconds for async logging
pub const ENV_OBS_LOG_FLUSH_MS: &str = "NEUBULAFX_OBS_LOG_FLUSH_MS";

/// Default values for log pool
pub const DEFAULT_OBS_LOG_POOL_CAPA: usize = 10240;

/// Default values for message capacity
pub const DEFAULT_OBS_LOG_MESSAGE_CAPA: usize = 32768;

/// Default values for flush interval in milliseconds
pub const DEFAULT_OBS_LOG_FLUSH_MS: u64 = 200;

/// Default values for observability configuration
// ### Supported Environment Values
// - `production` - Secure file-only logging
// - `development` - Full debugging with stdout
// - `test` - Test environment with stdout support
// - `staging` - Staging environment with stdout support
pub const DEFAULT_OBS_ENVIRONMENT_PRODUCTION: &str = "production";
pub const DEFAULT_OBS_ENVIRONMENT_DEVELOPMENT: &str = "development";
pub const DEFAULT_OBS_ENVIRONMENT_TEST: &str = "test";
pub const DEFAULT_OBS_ENVIRONMENT_STAGING: &str = "staging";

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_env_keys() {
        assert_eq!(ENV_OBS_ENDPOINT, "NEUBULAFX_OBS_ENDPOINT");
        assert_eq!(ENV_OBS_TRACE_ENDPOINT, "NEUBULAFX_OBS_TRACE_ENDPOINT");
        assert_eq!(ENV_OBS_METRIC_ENDPOINT, "NEUBULAFX_OBS_METRIC_ENDPOINT");
        assert_eq!(ENV_OBS_LOG_ENDPOINT, "NEUBULAFX_OBS_LOG_ENDPOINT");
        assert_eq!(ENV_OBS_USE_STDOUT, "NEUBULAFX_OBS_USE_STDOUT");
        assert_eq!(ENV_OBS_SAMPLE_RATIO, "NEUBULAFX_OBS_SAMPLE_RATIO");
        assert_eq!(ENV_OBS_METER_INTERVAL, "NEUBULAFX_OBS_METER_INTERVAL");
        assert_eq!(ENV_OBS_SERVICE_NAME, "NEUBULAFX_OBS_SERVICE_NAME");
        assert_eq!(ENV_OBS_SERVICE_VERSION, "NEUBULAFX_OBS_SERVICE_VERSION");
        assert_eq!(ENV_OBS_ENVIRONMENT, "NEUBULAFX_OBS_ENVIRONMENT");
        assert_eq!(ENV_OBS_LOGGER_LEVEL, "NEUBULAFX_OBS_LOGGER_LEVEL");
        assert_eq!(ENV_OBS_LOG_STDOUT_ENABLED, "NEUBULAFX_OBS_LOG_STDOUT_ENABLED");
        assert_eq!(ENV_OBS_LOG_DIRECTORY, "NEUBULAFX_OBS_LOG_DIRECTORY");
        assert_eq!(ENV_OBS_LOG_FILENAME, "NEUBULAFX_OBS_LOG_FILENAME");
        assert_eq!(ENV_OBS_LOG_ROTATION_SIZE_MB, "NEUBULAFX_OBS_LOG_ROTATION_SIZE_MB");
        assert_eq!(ENV_OBS_LOG_ROTATION_TIME, "NEUBULAFX_OBS_LOG_ROTATION_TIME");
        assert_eq!(ENV_OBS_LOG_KEEP_FILES, "NEUBULAFX_OBS_LOG_KEEP_FILES");
    }

    #[test]
    fn test_default_values() {
        assert_eq!(DEFAULT_OBS_ENVIRONMENT_PRODUCTION, "production");
        assert_eq!(DEFAULT_OBS_ENVIRONMENT_DEVELOPMENT, "development");
        assert_eq!(DEFAULT_OBS_ENVIRONMENT_TEST, "test");
        assert_eq!(DEFAULT_OBS_ENVIRONMENT_STAGING, "staging");
    }
}
