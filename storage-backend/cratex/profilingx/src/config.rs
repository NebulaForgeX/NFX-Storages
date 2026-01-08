
use serde::{Deserialize, Serialize};
use std::time::Duration;

// Default values for profiling configuration
pub const DEFAULT_ENABLE_PROFILING: bool = false;
pub const DEFAULT_CPU_MODE: &str = "off";
pub const DEFAULT_CPU_FREQ: usize = 100;
pub const DEFAULT_CPU_INTERVAL_SECS: u64 = 60;
pub const DEFAULT_CPU_DURATION_SECS: u64 = 10;
pub const DEFAULT_MEM_PERIODIC: bool = false;
pub const DEFAULT_MEM_INTERVAL_SECS: u64 = 300;
pub const DEFAULT_OUTPUT_DIR: &str = "./profiles";

/// CPU profiling mode
#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum CpuMode {
    Off,
    Continuous,
    Periodic,
}

impl Default for CpuMode {
    fn default() -> Self {
        CpuMode::Off
    }
}

impl From<&str> for CpuMode {
    fn from(s: &str) -> Self {
        match s.to_lowercase().as_str() {
            "continuous" => CpuMode::Continuous,
            "periodic" => CpuMode::Periodic,
            _ => CpuMode::Off,
        }
    }
}

/// Profiling configuration
///
/// This struct defines all configuration options for the profiling system,
/// including CPU and memory profiling settings.
#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct ProfilingConfig {
    /// Enable profiling system
    pub enabled: Option<bool>,
    /// Output directory for profiling reports
    pub output_dir: Option<String>,
    /// CPU profiling mode: "off", "continuous", or "periodic"
    pub cpu_mode: Option<String>,
    /// CPU profiling frequency (Hz)
    pub cpu_freq: Option<usize>,
    /// CPU profiling interval in seconds (for periodic mode)
    pub cpu_interval_secs: Option<u64>,
    /// CPU profiling duration in seconds (for periodic mode)
    pub cpu_duration_secs: Option<u64>,
    /// Enable periodic memory profiling
    pub mem_periodic: Option<bool>,
    /// Memory profiling interval in seconds
    pub mem_interval_secs: Option<u64>,
}

impl ProfilingConfig {
    /// Create a new instance of ProfilingConfig with default values
    pub fn new() -> Self {
        Self {
            enabled: None,
            output_dir: None,
            cpu_mode: None,
            cpu_freq: None,
            cpu_interval_secs: None,
            cpu_duration_secs: None,
            mem_periodic: None,
            mem_interval_secs: None,
        }
    }

    /// Get CPU mode, defaulting to DEFAULT_CPU_MODE
    pub fn cpu_mode(&self) -> CpuMode {
        self.cpu_mode
            .as_deref()
            .map(CpuMode::from)
            .unwrap_or_else(|| CpuMode::from(DEFAULT_CPU_MODE))
    }

    /// Get output directory, defaulting to DEFAULT_OUTPUT_DIR
    pub fn output_dir(&self) -> String {
        self.output_dir
            .clone()
            .unwrap_or_else(|| DEFAULT_OUTPUT_DIR.to_string())
    }

    /// Get CPU frequency, defaulting to DEFAULT_CPU_FREQ
    pub fn cpu_freq(&self) -> usize {
        self.cpu_freq.unwrap_or(DEFAULT_CPU_FREQ)
    }

    /// Get CPU interval, defaulting to DEFAULT_CPU_INTERVAL_SECS
    pub fn cpu_interval(&self) -> Duration {
        Duration::from_secs(self.cpu_interval_secs.unwrap_or(DEFAULT_CPU_INTERVAL_SECS))
    }

    /// Get CPU duration, defaulting to DEFAULT_CPU_DURATION_SECS
    pub fn cpu_duration(&self) -> Duration {
        Duration::from_secs(self.cpu_duration_secs.unwrap_or(DEFAULT_CPU_DURATION_SECS))
    }

    /// Get memory periodic flag, defaulting to DEFAULT_MEM_PERIODIC
    pub fn mem_periodic(&self) -> bool {
        self.mem_periodic.unwrap_or(DEFAULT_MEM_PERIODIC)
    }

    /// Get memory interval, defaulting to DEFAULT_MEM_INTERVAL_SECS
    pub fn mem_interval(&self) -> Duration {
        Duration::from_secs(self.mem_interval_secs.unwrap_or(DEFAULT_MEM_INTERVAL_SECS))
    }

    /// Check if profiling is enabled, defaulting to DEFAULT_ENABLE_PROFILING
    pub fn enabled(&self) -> bool {
        self.enabled.unwrap_or(DEFAULT_ENABLE_PROFILING)
    }
}

impl Default for ProfilingConfig {
    fn default() -> Self {
        Self::new()
    }
}

