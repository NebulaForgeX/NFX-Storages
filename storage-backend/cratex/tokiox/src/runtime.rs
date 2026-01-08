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

use crate::config::RuntimeConfig;
use sysinfo::{RefreshKind, System};

#[inline]
pub(crate) fn compute_default_thread_stack_size() -> usize {
    // Baseline: Release 1 MiB，Debug 2 MiB；macOS at least 2 MiB
    // macOS is more conservative: many system libraries and backtracking are more "stack-eating"
    if cfg!(debug_assertions) || cfg!(target_os = "macos") {
        2 * crate::config::DEFAULT_THREAD_STACK_SIZE
    } else {
        crate::config::DEFAULT_THREAD_STACK_SIZE
    }
}

#[inline]
pub(crate) fn detect_cores() -> usize {
    // Priority physical cores, fallback logic cores, minimum 1
    let mut sys = System::new_with_specifics(RefreshKind::everything().without_memory().without_processes());
    sys.refresh_cpu_all();
    sys.cpus().len().max(1)
}

#[inline]
pub(crate) fn compute_default_worker_threads() -> usize {
    // Physical cores are used by default (closer to CPU compute resources and cache topology)
    detect_cores()
}

/// Default max_blocking_threads calculations based on sysinfo:
/// 16 cores -> 1024; more than 16 cores are doubled by multiples:
/// 1..=16 -> 1024, 17..=32 -> 2048, 33..=64 -> 4096, and so on.
pub(crate) fn compute_default_max_blocking_threads() -> usize {
    const BASE_CORES: usize = crate::config::DEFAULT_WORKER_THREADS;
    const BASE_THREADS: usize = crate::config::DEFAULT_MAX_BLOCKING_THREADS;

    let cores = detect_cores();

    let mut threads = BASE_THREADS;
    let mut threshold = BASE_CORES;

    // When the number of cores exceeds the threshold, the number of threads is doubled for each doubling threshold
    while cores > threshold {
        threads = threads.saturating_mul(2);
        threshold = threshold.saturating_mul(2);
    }

    threads
}

/// Create a Tokio runtime builder from configuration
///
/// This function creates a configured Tokio runtime builder based on the provided
/// `RuntimeConfig`. If `None` is provided, it uses environment variables and defaults.
///
/// Configuration priority:
/// 1. Environment variables (highest priority)
/// 2. RuntimeConfig values
/// 3. Auto-detected/default values (lowest priority)
///
/// # Arguments
///
/// * `config` - Optional runtime configuration. If `None`, uses environment variables and defaults.
///
/// # Returns
///
/// A configured Tokio runtime builder ready to be built.
///
/// # Examples
///
/// ```no_run
/// use nebulafx_tokiox::{get_tokio_runtime_builder, RuntimeConfig};
///
/// // Using default configuration
/// let builder = get_tokio_runtime_builder(None);
/// let runtime = builder.build().unwrap();
///
/// // Using custom configuration
/// let config = RuntimeConfig {
///     worker_threads: Some(8),
///     ..Default::default()
/// };
/// let builder = get_tokio_runtime_builder(Some(&config));
/// let runtime = builder.build().unwrap();
/// ```
pub fn get_tokio_runtime_builder(config: Option<&RuntimeConfig>) -> tokio::runtime::Builder {
    let default_config = RuntimeConfig::default();
    let config = config.unwrap_or(&default_config);
    
    let mut builder = tokio::runtime::Builder::new_multi_thread();

    let worker_threads = config.worker_threads();
    builder.worker_threads(worker_threads);

    let max_blocking_threads = config.max_blocking_threads();
    builder.max_blocking_threads(max_blocking_threads);

    let thread_stack_size = config.thread_stack_size();
    builder.thread_stack_size(thread_stack_size);

    let thread_keep_alive = config.thread_keep_alive();
    builder.thread_keep_alive(thread_keep_alive);

    let global_queue_interval = config.global_queue_interval();
    builder.global_queue_interval(global_queue_interval);

    let event_interval = config.event_interval();
    builder.event_interval(event_interval);

    let thread_name = config.thread_name();
    builder.thread_name(thread_name.clone());

    let max_io_events_per_tick = config.max_io_events_per_tick();
    builder.enable_all().max_io_events_per_tick(max_io_events_per_tick);

    // Optional: Simple log of thread start/stop
    if config.thread_print_enabled() {
        builder
            .on_thread_start(|| {
                let id = std::thread::current().id();
                println!(
                    "NebulaFX Worker Thread running - initializing resources time: {:?}, thread id: {:?}",
                    chrono::Utc::now().to_rfc3339(),
                    id
                );
            })
            .on_thread_stop(|| {
                let id = std::thread::current().id();
                println!(
                    "NebulaFX Worker Thread stopping - cleaning up resources time: {:?}, thread id: {:?}",
                    chrono::Utc::now().to_rfc3339(),
                    id
                )
            });
    }

    // Print configuration in non-production mode
    let is_production = std::env::var("ENVIRONMENT")
        .map(|v| ["pro", "production", "p", "P", "PRO", "PRODUCTION"].contains(&v.as_str()))
        .unwrap_or(false);

    if !is_production {
        println!(
            "Starting Tokio runtime with configured parameters:\n\
         worker_threads: {worker_threads}, max_blocking_threads: {max_blocking_threads}, \
         thread_stack_size: {thread_stack_size}, thread_keep_alive: {:?}, \
         global_queue_interval: {global_queue_interval}, event_interval: {event_interval}, \
         max_io_events_per_tick: {max_io_events_per_tick}, thread_name: {thread_name}",
            thread_keep_alive
        );
    }

    builder
}

