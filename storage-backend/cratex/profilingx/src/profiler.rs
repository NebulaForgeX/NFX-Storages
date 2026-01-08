
use crate::config::{CpuMode, ProfilingConfig};
use chrono::Utc;
use jemalloc_pprof::PROF_CTL;
use pprof::protos::Message;
use std::fmt;
use std::fs::{create_dir_all, File};
use std::io::Write;
use std::path::{Path, PathBuf};
use std::sync::{Arc, OnceLock};
use std::time::Duration;
use thiserror::Error;
use tokio::sync::Mutex;
use tokio::time::sleep;
use tracing::{debug, error, info, warn};

static CPU_CONT_GUARD: OnceLock<Arc<Mutex<Option<pprof::ProfilerGuard<'static>>>>> = OnceLock::new();

pub struct Success;

impl fmt::Display for Success {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "Success")
    }
}

#[derive(Debug, Error)]
pub enum ProfilingError {
    #[error("profiling initialization failed: {0}")]
    InitializationFailed(String),
}

/// Generate timestamp string for filenames
fn ts() -> String {
    Utc::now().format("%Y%m%dT%H%M%S").to_string()
}

/// Get or create output directory from config
fn output_dir(config: &ProfilingConfig) -> PathBuf {
    let dir = config.output_dir();
    let p = PathBuf::from(dir);
    if let Err(e) = create_dir_all(&p) {
        warn!("profiling: create output dir {} failed: {}, fallback to current dir", p.display(), e);
        return PathBuf::from(".");
    }
    p
}

/// Write pprof report to file in protobuf format
fn write_pprof_report_pb(report: &pprof::Report, path: &Path) -> Result<(), String> {
    let profile = report.pprof().map_err(|e| format!("pprof() failed: {e}"))?;
    let mut buf = Vec::with_capacity(512 * 1024);
    profile.write_to_vec(&mut buf).map_err(|e| format!("encode failed: {e}"))?;
    let mut f = File::create(path).map_err(|e| format!("create file failed: {e}"))?;
    f.write_all(&buf).map_err(|e| format!("write file failed: {e}"))?;
    Ok(())
}

/// Internal: dump CPU pprof from existing guard
async fn dump_cpu_with_guard(guard: &pprof::ProfilerGuard<'_>, output_dir: &Path) -> Result<PathBuf, String> {
    let report = guard.report().build().map_err(|e| format!("build report failed: {e}"))?;
    let out = output_dir.join(format!("cpu_profile_{}.pb", ts()));
    write_pprof_report_pb(&report, &out)?;
    info!("CPU profile exported: {}", out.display());
    Ok(out)
}

/// Public API: dump CPU for a duration; if continuous guard exists, snapshot immediately.
pub async fn dump_cpu_pprof_for(config: &ProfilingConfig, duration: Duration) -> Result<PathBuf, String> {
    let output_dir = output_dir(config);
    
    if let Some(cell) = CPU_CONT_GUARD.get() {
        let guard_slot = cell.lock().await;
        if let Some(ref guard) = *guard_slot {
            debug!("profiling: using continuous profiler guard for CPU dump");
            return dump_cpu_with_guard(guard, &output_dir).await;
        }
    }

    let freq = config.cpu_freq() as i32;
    let guard = pprof::ProfilerGuard::new(freq).map_err(|e| format!("create profiler failed: {e}"))?;
    sleep(duration).await;

    dump_cpu_with_guard(&guard, &output_dir).await
}

/// Public API: dump memory pprof now (jemalloc)
pub async fn dump_memory_pprof_now(config: &ProfilingConfig) -> Result<PathBuf, String> {
    let output_dir = output_dir(config);
    let out = output_dir.join(format!("mem_profile_{}.pb", ts()));
    let mut f = File::create(&out).map_err(|e| format!("create file failed: {e}"))?;

    let prof_ctl_cell = PROF_CTL
        .as_ref()
        .ok_or_else(|| "jemalloc profiling control not available".to_string())?;
    let mut prof_ctl = prof_ctl_cell.lock().await;

    if !prof_ctl.activated() {
        return Err("jemalloc profiling is not active".to_string());
    }

    let bytes = prof_ctl.dump_pprof().map_err(|e| format!("dump pprof failed: {e}"))?;
    f.write_all(&bytes).map_err(|e| format!("write file failed: {e}"))?;
    info!("Memory profile exported: {}", out.display());
    Ok(out)
}

/// Jemalloc status check (No forced placement, only status observation)
pub async fn check_jemalloc_profiling() {
    use tikv_jemalloc_ctl::{config, epoch, stats};

    if let Err(e) = epoch::advance() {
        warn!("jemalloc epoch advance failed: {e}");
    }

    match config::malloc_conf::read() {
        Ok(conf) => debug!("jemalloc malloc_conf: {}", conf),
        Err(e) => debug!("jemalloc read malloc_conf failed: {e}"),
    }

    match std::env::var("MALLOC_CONF") {
        Ok(v) => debug!("MALLOC_CONF={}", v),
        Err(_) => debug!("MALLOC_CONF is not set"),
    }

    if let Some(lock) = PROF_CTL.as_ref() {
        let ctl = lock.lock().await;
        info!(activated = ctl.activated(), "jemalloc profiling status");
    } else {
        info!("jemalloc profiling controller is NOT available");
    }

    let _ = epoch::advance();
    macro_rules! show {
        ($name:literal, $reader:expr) => {
            match $reader {
                Ok(v) => debug!(concat!($name, "={}"), v),
                Err(e) => debug!(concat!($name, " read failed: {}"), e),
            }
        };
    }
    show!("allocated", stats::allocated::read());
    show!("resident", stats::resident::read());
    show!("mapped", stats::mapped::read());
    show!("metadata", stats::metadata::read());
    show!("active", stats::active::read());
}

/// Internal: start continuous CPU profiling
async fn start_cpu_continuous(config: &ProfilingConfig) {
    let freq_hz = config.cpu_freq() as i32;
    let cell = CPU_CONT_GUARD.get_or_init(|| Arc::new(Mutex::new(None))).clone();
    let mut slot = cell.lock().await;
    if slot.is_some() {
        warn!("profiling: continuous CPU guard already running");
        return;
    }
    match pprof::ProfilerGuardBuilder::default()
        .frequency(freq_hz)
        .blocklist(&["libc", "libgcc", "pthread", "vdso"])
        .build()
    {
        Ok(guard) => {
            *slot = Some(guard);
            info!(freq = freq_hz, "start continuous CPU profiling");
        }
        Err(e) => warn!("start continuous CPU profiling failed: {e}"),
    }
}

/// Internal: start periodic CPU sampling loop
async fn start_cpu_periodic(config: &ProfilingConfig) {
    let freq_hz = config.cpu_freq() as i32;
    let interval = config.cpu_interval();
    let duration = config.cpu_duration();
    let output_dir = output_dir(config);
    
    info!(freq = freq_hz, ?interval, ?duration, "start periodic CPU profiling");
    tokio::spawn(async move {
        loop {
            sleep(interval).await;
            let guard = match pprof::ProfilerGuard::new(freq_hz) {
                Ok(g) => g,
                Err(e) => {
                    warn!("periodic CPU profiler create failed: {e}");
                    continue;
                }
            };
            sleep(duration).await;
            match guard.report().build() {
                Ok(report) => {
                    let out = output_dir.join(format!("cpu_profile_{}.pb", ts()));
                    if let Err(e) = write_pprof_report_pb(&report, &out) {
                        warn!("write periodic CPU pprof failed: {e}");
                    } else {
                        info!("periodic CPU profile exported: {}", out.display());
                    }
                }
                Err(e) => warn!("periodic CPU report build failed: {e}"),
            }
        }
    });
}

/// Internal: start periodic memory dump when jemalloc profiling is active
async fn start_memory_periodic(config: &ProfilingConfig) {
    let interval = config.mem_interval();
    let output_dir = output_dir(config);
    
    info!(?interval, "start periodic memory pprof dump");
    tokio::spawn(async move {
        loop {
            sleep(interval).await;

            let Some(lock) = PROF_CTL.as_ref() else {
                debug!("skip memory dump: PROF_CTL not available");
                continue;
            };

            let mut ctl = lock.lock().await;
            if !ctl.activated() {
                debug!("skip memory dump: jemalloc profiling not active");
                continue;
            }

            let out = output_dir.join(format!("mem_profile_periodic_{}.pb", ts()));
            match File::create(&out) {
                Err(e) => {
                    error!("periodic mem dump create file failed: {}", e);
                    continue;
                }
                Ok(mut f) => match ctl.dump_pprof() {
                    Ok(bytes) => {
                        if let Err(e) = f.write_all(&bytes) {
                            error!("periodic mem dump write failed: {}", e);
                        } else {
                            info!("periodic memory profile dumped to {}", out.display());
                        }
                    }
                    Err(e) => error!("periodic mem dump failed: {}", e),
                },
            }
        }
    });
}

/// Public: unified init entry, initialize profiling from config
/// 
/// If `config` is `None`, uses default configuration (profiling disabled).
pub async fn init_profiling(config: Option<&ProfilingConfig>) -> Result<Success, ProfilingError> {
    // Profiling is not supported on Windows
    #[cfg(target_os = "windows")]
    {
        debug!("profiling: not supported on Windows, skipping initialization");
        return Ok(Success);
    }

    #[cfg(not(target_os = "windows"))]
    {
        let config = config.cloned().unwrap_or_default();
        
        if !config.enabled() {
            debug!("profiling: disabled by config");
            return Ok(Success);
        }

        // Jemalloc state check once (no dump)
        check_jemalloc_profiling().await;

        // CPU
        let cpu_mode = config.cpu_mode();
        match cpu_mode {
            CpuMode::Off => debug!("profiling: CPU mode off"),
            CpuMode::Continuous => start_cpu_continuous(&config).await,
            CpuMode::Periodic => start_cpu_periodic(&config).await,
        }

        // Memory
        if config.mem_periodic() {
            start_memory_periodic(&config).await;
        }
    }

    Ok(Success)
}

