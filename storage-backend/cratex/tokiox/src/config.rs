//  Copyright 2024 NebulaFX Team
//
//  Licensed under the Apache License, Version 2.0 (the "License");
//  you may not use this file except in compliance with the License.
//  You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
//  Unless required by applicable law or agreed to in writing, software
//  distributed under the License is distributed on an "AS IS" BASIS,
//  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//  See the License for the specific language governing permissions and
//  limitations under the License.

use serde::{Deserialize, Serialize};
use std::time::Duration;

// Constants
const MI_B: usize = 1024 * 1024; // 1 MiB

// Default values for runtime configuration
pub const DEFAULT_WORKER_THREADS: usize = 16;
pub const DEFAULT_MAX_BLOCKING_THREADS: usize = 1024;
pub const DEFAULT_THREAD_PRINT_ENABLED: bool = false;
pub const DEFAULT_THREAD_STACK_SIZE: usize = MI_B; // 1 MiB
pub const DEFAULT_THREAD_KEEP_ALIVE: u64 = 60; // seconds
pub const DEFAULT_GLOBAL_QUEUE_INTERVAL: u32 = 31;
pub const DEFAULT_THREAD_NAME: &str = "nebulafx-worker";
pub const DEFAULT_MAX_IO_EVENTS_PER_TICK: usize = 1024;
pub const DEFAULT_EVENT_INTERVAL: u32 = 61;

/// Tokio runtime configuration
///
/// This struct defines all configuration options for the Tokio runtime,
/// including worker threads, blocking threads, and various runtime parameters.
#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct RuntimeConfig {
    /// Number of worker threads (default: auto-detect CPU cores)
    pub worker_threads: Option<usize>,
    /// Maximum number of blocking threads (default: calculated based on CPU cores)
    pub max_blocking_threads: Option<usize>,
    /// Thread stack size in bytes (default: 1 MiB for release, 2 MiB for debug/macOS)
    pub thread_stack_size: Option<usize>,
    /// Thread keep alive duration in seconds (default: 60)
    pub thread_keep_alive: Option<u64>,
    /// Global queue interval (default: 31)
    pub global_queue_interval: Option<u32>,
    /// Thread name prefix (default: "nebulafx-worker")
    pub thread_name: Option<String>,
    /// Maximum I/O events per tick (default: 1024)
    pub max_io_events_per_tick: Option<usize>,
    /// Event interval (default: 61)
    pub event_interval: Option<u32>,
    /// Enable thread start/stop logging (default: false)
    pub thread_print_enabled: Option<bool>,
    /// RNG seed for deterministic randomness (default: None, means random)
    pub rng_seed: Option<u64>,
}

impl RuntimeConfig {
    /// Create a new instance of RuntimeConfig with default values
    pub fn new() -> Self {
        Self {
            worker_threads: None,
            max_blocking_threads: None,
            thread_stack_size: None,
            thread_keep_alive: None,
            global_queue_interval: None,
            thread_name: None,
            max_io_events_per_tick: None,
            event_interval: None,
            thread_print_enabled: None,
            rng_seed: None,
        }
    }

    /// Get worker threads, defaulting to auto-detected CPU cores
    pub fn worker_threads(&self) -> usize {
        self.worker_threads.unwrap_or_else(|| crate::runtime::compute_default_worker_threads())
    }

    /// Get max blocking threads, defaulting to calculated value
    pub fn max_blocking_threads(&self) -> usize {
        self.max_blocking_threads.unwrap_or_else(|| crate::runtime::compute_default_max_blocking_threads())
    }

    /// Get thread stack size, defaulting to platform-specific value
    pub fn thread_stack_size(&self) -> usize {
        self.thread_stack_size.unwrap_or_else(|| crate::runtime::compute_default_thread_stack_size())
    }

    /// Get thread keep alive duration
    pub fn thread_keep_alive(&self) -> Duration {
        Duration::from_secs(self.thread_keep_alive.unwrap_or(DEFAULT_THREAD_KEEP_ALIVE))
    }

    /// Get global queue interval
    pub fn global_queue_interval(&self) -> u32 {
        self.global_queue_interval.unwrap_or(DEFAULT_GLOBAL_QUEUE_INTERVAL)
    }

    /// Get thread name
    pub fn thread_name(&self) -> String {
        self.thread_name.clone().unwrap_or_else(|| DEFAULT_THREAD_NAME.to_string())
    }

    /// Get max I/O events per tick
    pub fn max_io_events_per_tick(&self) -> usize {
        self.max_io_events_per_tick.unwrap_or(DEFAULT_MAX_IO_EVENTS_PER_TICK)
    }

    /// Get event interval
    pub fn event_interval(&self) -> u32 {
        self.event_interval.unwrap_or(DEFAULT_EVENT_INTERVAL)
    }

    /// Get thread print enabled flag
    pub fn thread_print_enabled(&self) -> bool {
        self.thread_print_enabled.unwrap_or(DEFAULT_THREAD_PRINT_ENABLED)
    }

    /// Get RNG seed
    pub fn rng_seed(&self) -> Option<u64> {
        self.rng_seed
    }
}

impl Default for RuntimeConfig {
    fn default() -> Self {
        Self::new()
    }
}

