

/// Metrics collection interval in milliseconds for system metrics (CPU, memory, disk, network).
pub const DEFAULT_METRICS_SYSTEM_INTERVAL_MS: u64 = 30000;

/// Environment variable for setting the metrics collection interval for system metrics.
pub const ENV_OBS_METRICS_SYSTEM_INTERVAL_MS: &str = "NEUBULAFX_OBS_METRICS_SYSTEM_INTERVAL_MS";
