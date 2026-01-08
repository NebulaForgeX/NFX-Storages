
//! # NebulaFX Profiling
//!
//! Performance profiling tools for NebulaFX, providing CPU and memory profiling capabilities.
//!
//! ## Usage
//!
//! ```no_run
//! use nebulafx_profilingx::{init_profiling, ProfilingConfig};
//!
//! # #[tokio::main]
//! # async fn main() {
//! #   let config = ProfilingConfig::default();
//! #   init_profiling(&config).await;
//! # }
//! ```

mod config;
mod profiler;

pub use config::{CpuMode, ProfilingConfig};
pub use profiler::{
    check_jemalloc_profiling, dump_cpu_pprof_for, dump_memory_pprof_now, init_profiling,
    ProfilingError, Success,
};

