

use crate::config::{
    ObservabilityConfig,
    DEFAULT_APP_NAME, DEFAULT_ENVIRONMENT, DEFAULT_ENVIRONMENT_PRODUCTION, DEFAULT_LOG_KEEP_FILES,
    DEFAULT_LOG_LEVEL, DEFAULT_OBS_LOG_FLUSH_MS, DEFAULT_OBS_LOG_MESSAGE_CAPA, DEFAULT_OBS_LOG_POOL_CAPA,
    DEFAULT_OBS_LOG_STDOUT_ENABLED,
};
use crate::TelemetryError;
use flexi_logger::{DeferredNow, Record, WriteMode, WriteMode::AsyncWith, style};
use metrics::counter;
use nu_ansi_term::Color;
use smallvec::SmallVec;
use std::{fs, io::IsTerminal, time::Duration};
use tracing::info;
use tracing_error::ErrorLayer;
use tracing_subscriber::{
    EnvFilter,
    fmt::{format::FmtSpan, time::LocalTime},
    layer::SubscriberExt,
    util::SubscriberInitExt,
};

/// A guard object that manages the lifecycle of logging components.
///
/// This struct holds references to the created logging handlers and ensures
/// they are properly shut down when the guard is dropped. It implements the RAII
/// (Resource Acquisition Is Initialization) pattern for managing logging resources.
///
/// When this guard goes out of scope, it will automatically shut down:
/// - The flexi_logger handles (for file logging)
/// - The tracing guard (for stdout logging)
pub struct LoggingGuard {
    flexi_logger_handles: Option<flexi_logger::LoggerHandle>,
    tracing_guard: Option<tracing_appender::non_blocking::WorkerGuard>,
}

impl std::fmt::Debug for LoggingGuard {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("LoggingGuard")
            .field("flexi_logger_handles", &self.flexi_logger_handles.is_some())
            .field("tracing_guard", &self.tracing_guard.is_some())
            .finish()
    }
}

impl Drop for LoggingGuard {
    fn drop(&mut self) {
        if let Some(handle) = self.flexi_logger_handles.take() {
            handle.shutdown();
            println!("flexi_logger shutdown completed");
        }

        if let Some(guard) = self.tracing_guard.take() {
            drop(guard);
            println!("Tracing guard dropped, flushing logs.");
        }
    }
}


// Create AsyncWith parameter from config
fn get_async_with(config: &ObservabilityConfig) -> WriteMode {
    let pool_capa = config.log_pool_capa.unwrap_or(DEFAULT_OBS_LOG_POOL_CAPA);
    let message_capa = config.log_message_capa.unwrap_or(DEFAULT_OBS_LOG_MESSAGE_CAPA);
    let flush_ms = config.log_flush_ms.unwrap_or(DEFAULT_OBS_LOG_FLUSH_MS);

    AsyncWith {
        pool_capa,
        message_capa,
        flush_interval: Duration::from_millis(flush_ms),
    }
}

fn build_env_filter(logger_level: &str, default_level: Option<&str>) -> EnvFilter {
    let level = default_level.unwrap_or(logger_level);
    // Use the logger_level from config, not from environment variable
    let mut filter = EnvFilter::new(level);
    if !matches!(logger_level, "trace" | "debug") {
        let directives: SmallVec<[&str; 5]> = smallvec::smallvec!["hyper", "tonic", "h2", "reqwest", "tower"];
        for directive in directives {
            filter = filter.add_directive(format!("{directive}=off").parse().unwrap());
        }
    }

    filter
}

/// Custom Log Formatter Function - Terminal Output (with Color)
#[inline(never)]
fn format_with_color(w: &mut dyn std::io::Write, now: &mut DeferredNow, record: &Record) -> Result<(), std::io::Error> {
    let level = record.level();
    let level_style = style(level);
    let binding = std::thread::current();
    let thread_name = binding.name().unwrap_or("unnamed");
    let thread_id = format!("{:?}", std::thread::current().id());
    writeln!(
        w,
        "[{}] {} [{}] [{}:{}] [{}:{}] {}",
        now.now().format(flexi_logger::TS_DASHES_BLANK_COLONS_DOT_BLANK),
        level_style.paint(level.to_string()),
        Color::Magenta.paint(record.target()),
        Color::Blue.paint(record.file().unwrap_or("unknown")),
        Color::Blue.paint(record.line().unwrap_or(0).to_string()),
        Color::Green.paint(thread_name),
        Color::Green.paint(thread_id),
        record.args()
    )
}

/// Custom Log Formatter - File Output (No Color)
#[inline(never)]
fn format_for_file(w: &mut dyn std::io::Write, now: &mut DeferredNow, record: &Record) -> Result<(), std::io::Error> {
    let level = record.level();
    let binding = std::thread::current();
    let thread_name = binding.name().unwrap_or("unnamed");
    let thread_id = format!("{:?}", std::thread::current().id());
    writeln!(
        w,
        "[{}] {} [{}] [{}:{}] [{}:{}] {}",
        now.now().format(flexi_logger::TS_DASHES_BLANK_COLONS_DOT_BLANK),
        level,
        record.target(),
        record.file().unwrap_or("unknown"),
        record.line().unwrap_or(0),
        thread_name,
        thread_id,
        record.args()
    )
}

/// stdout + span information (fix: retain WorkerGuard to avoid releasing after initialization)
fn init_stdout_logging(config: &ObservabilityConfig, logger_level: &str, is_production: bool) -> LoggingGuard {
    let env_filter = build_env_filter(logger_level, None);
    let (nb, guard) = tracing_appender::non_blocking(std::io::stdout());
    let enable_color = std::io::stdout().is_terminal();
    
    // Check if JSON format is enabled from config
    let use_json = config.log_json.unwrap_or(false);
    
    let span_event = if is_production { FmtSpan::CLOSE } else { FmtSpan::FULL };
    
    // 根据配置选择格式（必须在创建时就决定，不能后续修改）
    if use_json {
        // JSON 格式（用于生产环境或日志收集系统）
        let fmt_layer = tracing_subscriber::fmt::layer()
            .with_timer(LocalTime::rfc_3339())
            .with_target(true)
            .with_ansi(enable_color)
            .with_writer(nb)
            .json()
            .with_current_span(true)
            .with_span_list(true)
            .with_thread_names(true)
            .with_thread_ids(true)
            .with_file(true)
            .with_line_number(true)
            .with_span_events(span_event);
        
        tracing_subscriber::registry()
            .with(env_filter)
            .with(ErrorLayer::default())
            .with(fmt_layer)
            .init();
    } else {
        // 友好的文本格式（用于开发环境）
        // 格式: [时间] [级别] [模块] 消息
        let fmt_layer = tracing_subscriber::fmt::layer()
            .with_timer(LocalTime::rfc_3339())
            .with_target(true)
            .with_ansi(enable_color)
            .with_writer(nb)
            .compact() // 使用紧凑格式，更易读
            .with_thread_names(false) // 开发环境不需要线程名
            .with_thread_ids(false)   // 开发环境不需要线程ID
            .with_file(false)         // 开发环境不需要文件名
            .with_line_number(false)  // 开发环境不需要行号
            .with_span_events(span_event);
        
        tracing_subscriber::registry()
            .with(env_filter)
            .with(ErrorLayer::default())
            .with(fmt_layer)
            .init();
    }

    counter!("nebulafx.start.total").increment(1);
    info!("Init stdout logging (level: {}, format: {})", logger_level, if use_json { "json" } else { "text" });
    LoggingGuard {
        flexi_logger_handles: None,
        tracing_guard: Some(guard),
    }
}

/// File rolling log (size switching + number retained)
fn init_file_logging(config: &ObservabilityConfig, logger_level: &str, is_production: bool) -> Result<LoggingGuard, TelemetryError> {
    use flexi_logger::{Age, Cleanup, Criterion, FileSpec, LogSpecification, Naming};

    let service_name = config.service_name.as_deref().unwrap_or(DEFAULT_APP_NAME);
    let log_directory = config.log_directory.as_deref().ok_or_else(|| {
        TelemetryError::Io("log_directory is required for file logging".to_string())
    })?;
    let log_filename = config.log_filename.as_deref().unwrap_or(service_name);
    let keep_files: usize = config.log_keep_files.map(|v| v as usize).unwrap_or(DEFAULT_LOG_KEEP_FILES);
    if let Err(e) = fs::create_dir_all(log_directory) {
        return Err(TelemetryError::Io(e.to_string()));
    }
    #[cfg(unix)]
    {
        use std::fs::Permissions;
        use std::os::unix::fs::PermissionsExt;
        let desired: u32 = 0o755;
        match fs::metadata(log_directory) {
            Ok(meta) => {
                let current = meta.permissions().mode() & 0o777;
                // Only tighten to 0755 if existing permissions are looser than target, avoid loosening
                if (current & !desired) != 0 {
                    if let Err(e) = fs::set_permissions(log_directory, Permissions::from_mode(desired)) {
                        return Err(TelemetryError::SetPermissions(format!(
                            "dir='{}', want={:#o}, have={:#o}, err={}",
                            log_directory, desired, current, e
                        )));
                    }
                    // Second verification
                    if let Ok(meta2) = fs::metadata(log_directory) {
                        let after = meta2.permissions().mode() & 0o777;
                        if after != desired {
                            return Err(TelemetryError::SetPermissions(format!(
                                "dir='{}', want={:#o}, after={:#o}",
                                log_directory, desired, after
                            )));
                        }
                    }
                }
            }
            Err(e) => {
                return Err(TelemetryError::Io(format!("stat '{}' failed: {}", log_directory, e)));
            }
        }
    }

    // parsing level
    let log_spec = LogSpecification::parse(logger_level)
        .unwrap_or_else(|_| LogSpecification::parse(DEFAULT_LOG_LEVEL).unwrap_or(LogSpecification::error()));

    // Switch by size (MB), Build log cutting conditions
    let rotation_criterion = match (config.log_rotation_time.as_deref(), config.log_rotation_size_mb) {
        // Cut by time and size at the same time
        (Some(time), Some(size)) => {
            let age = match time.to_lowercase().as_str() {
                "hour" => Age::Hour,
                "day" => Age::Day,
                "minute" => Age::Minute,
                "second" => Age::Second,
                _ => Age::Day, // The default is by day
            };
            Criterion::AgeOrSize(age, size * 1024 * 1024) // Convert to bytes
        }
        // Cut by time only
        (Some(time), None) => {
            let age = match time.to_lowercase().as_str() {
                "hour" => Age::Hour,
                "day" => Age::Day,
                "minute" => Age::Minute,
                "second" => Age::Second,
                _ => Age::Day, // The default is by day
            };
            Criterion::Age(age)
        }
        // Cut by size only
        (None, Some(size)) => {
            Criterion::Size(size * 1024 * 1024) // Convert to bytes
        }
        // By default, it is cut by the day
        _ => Criterion::Age(Age::Day),
    };

    // write mode
    let write_mode = get_async_with(config);
    // Build (use logger_level from config, not from environment)
    let mut builder = flexi_logger::Logger::with(log_spec.clone())
        .format_for_stderr(format_with_color)
        .format_for_stdout(format_with_color)
        .format_for_files(format_for_file)
        .log_to_file(
            FileSpec::default()
                .directory(log_directory)
                .basename(log_filename)
                .suppress_timestamp(),
        )
        .rotate(rotation_criterion, Naming::TimestampsDirect, Cleanup::KeepLogFiles(keep_files))
        .write_mode(write_mode)
        .append()
        .use_utc();

    // Optional copy to stdout (for local observation)
    if config.log_stdout_enabled.unwrap_or(DEFAULT_OBS_LOG_STDOUT_ENABLED) || !is_production {
        builder = builder.duplicate_to_stdout(flexi_logger::Duplicate::All);
    } else {
        builder = builder.duplicate_to_stdout(flexi_logger::Duplicate::None);
    }

    let handle = match builder.start() {
        Ok(h) => Some(h),
        Err(e) => {
            eprintln!("ERROR: start flexi_logger failed: {e}");
            None
        }
    };

    counter!("nebulafx.start.total").increment(1);
    info!(
        "Init file logging at '{}', roll size {:?}MB, keep {}",
        log_directory, config.log_rotation_size_mb, keep_files
    );

    Ok(LoggingGuard {
        flexi_logger_handles: handle,
        tracing_guard: None,
    })
}


/// Initialize Telemetry
/// 
/// Two rules:
/// 1. If log directory is set in config, use file logging
/// 2. Otherwise, use stdout logging
pub(crate) fn init_telemetry(config: &ObservabilityConfig) -> Result<LoggingGuard, TelemetryError> {
    let environment = config.environment.as_deref().unwrap_or(DEFAULT_ENVIRONMENT);
    let is_production = environment.eq_ignore_ascii_case(DEFAULT_ENVIRONMENT_PRODUCTION);
    let logger_level = config.logger_level.as_deref().unwrap_or(DEFAULT_LOG_LEVEL);

    // Rule 1: If log directory is set in config, use file logging
    if config.log_directory.is_some() {
        return init_file_logging(config, logger_level, is_production);
    }

    // Rule 2: Default stdout (error level)
    Ok(init_stdout_logging(config, DEFAULT_LOG_LEVEL, is_production))
}

