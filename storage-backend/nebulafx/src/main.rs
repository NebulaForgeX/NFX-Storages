mod admin;
mod auth;
mod config;
mod error;
// mod grpc;

mod server;
mod storage;

use crate::server::{
    SHUTDOWN_TIMEOUT, ServiceState, ServiceStateManager, ShutdownSignal, init_event_notifier, shutdown_event_notifier,
    start_audit_system, start_http_server, stop_audit_system, wait_for_shutdown,
};
use crate::storage::ecfs::{process_lambda_configurations, process_queue_configurations, process_topic_configurations};
use nebulafx_ahm::{
    Scanner, create_ahm_services_cancel_token, heal::storage::ECStoreHealStorage, init_heal_manager,
    scanner::data_scanner::ScannerConfig, shutdown_ahm_services,
};
use nebulafx_common::globals::set_global_addr;
use nebulafx_ecstore::bucket::metadata_sys;
use nebulafx_ecstore::bucket::metadata_sys::init_bucket_metadata_sys;
use nebulafx_ecstore::bucket::replication::{GLOBAL_REPLICATION_POOL, init_background_replication};
use nebulafx_ecstore::config as ecconfig;
use nebulafx_ecstore::config::GLOBAL_CONFIG_SYS;
use nebulafx_profilingx::init_profiling;
use nebulafx_ecstore::store_api::BucketOptions;
use nebulafx_ecstore::{
    StorageAPI,
    endpoints::EndpointServerPools,
    global::{set_global_nebulafx_port, shutdown_background_services},
    notification_sys::new_global_notification_sys,
    set_global_endpoints,
    store::ECStore,
    store::init_local_disks,
    update_erasure_type,
};
use nebulafx_iamx::init_iam_sys;
use nebulafx_notify::notifier_global;
use nebulafx_obs::init_obs;
use nebulafx_targets::arn::TargetID;
use nebulafx_utils::net::parse_and_resolve_address;
use s3s::s3_error;
use std::env;
use std::io::{Error, Result};
use std::str::FromStr;
use std::sync::Arc;
use tokio_util::sync::CancellationToken;
use tracing::{debug, error, info, instrument, warn};

use config::{get_config, init_config, Config};
use nebulafx_postgresqlx::PostgreSQLPool;
use nebulafx_tokiox::get_tokio_runtime_builder;

#[cfg(all(target_os = "linux", target_env = "gnu"))]
#[global_allocator]
static GLOBAL: tikv_jemallocator::Jemalloc = tikv_jemallocator::Jemalloc;

#[cfg(all(target_os = "linux", target_env = "musl"))]
#[global_allocator]
static GLOBAL: mimalloc::MiMalloc = mimalloc::MiMalloc;

const LOGO: &str = r#"

╔═══════════════════════════════════════════════════════════════════╗
║███╗   ██╗███████╗██████╗ ██╗   ██╗██╗      █████╗ ███████╗██╗  ██╗║
║████╗  ██║██╔════╝██╔══██╗██║   ██║██║     ██╔══██╗██╔════╝╚██╗██╔╝║
║██╔██╗ ██║█████╗  ██████╔╝██║   ██║██║     ███████║█████╗   ╚███╔╝ ║
║██║╚██╗██║██╔══╝  ██╔══██╗██║   ██║██║     ██╔══██║██╔══╝   ██╔██╗ ║
║██║ ╚████║███████╗██████╔╝╚██████╔╝███████╗██║  ██║██║     ██╔╝ ██╗║
║╚═╝  ╚═══╝╚══════╝╚═════╝  ╚═════╝ ╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝  ╚═╝║
╚═══════════════════════════════════════════════════════════════════╝

"#;

fn main() -> Result<()> {
    info!("{}", LOGO);
    match init_config() {
        Ok(s) => info!("Config initialized successfully: {}", s),
        Err(e) => {
            error!("Failed to initialize config: {}", e);
            return Err(Error::other(format!("Failed to initialize config: {}", e)));
        }
    }
    match init_obs(get_config().observability.as_ref()) {
        Ok(s) => info!("Observability initialized successfully: {}", s),
        Err(e) => {
            error!("Failed to initialize observability: {}", e);
            return Err(Error::other(e));
        }
    }
    let runtime = get_tokio_runtime_builder(get_config().runtime.as_ref())
        .build()
        .expect("Failed to build Tokio runtime");
    runtime.block_on(async_main())
}
async fn async_main() -> Result<()> {
    let config = get_config();
    // Initialize PostgreSQL connection pool if database config exists
    match PostgreSQLPool::init(config.database.as_ref()).await {
        Ok(s) => info!("PostgreSQL connection pool initialized successfully: {}", s),
            Err(e) => {
                error!("Failed to initialize PostgreSQL connection pool: {}", e);
                return Err(Error::other(format!("Database connection failed: {}", e)));
            }
        }
    
    // Initialize database schema and root user if database is configured
    if let Some(db_config) = config.database.as_ref() {
        use nebulafx_iamx::init::{init_database, init_root_user};
        
        let pool = PostgreSQLPool::get()
            .map_err(|e| Error::other(format!("Failed to get database pool: {}", e)))?;
        
        // Get database connection URL for migrations
        let database_url = db_config.build_connection_url()
            .map_err(|e| Error::other(format!("Failed to build database URL: {}", e)))?;
        
        // Initialize database tables using Refinery (pure refinery, no sqlx mixing)
        if let Err(e) = init_database(&database_url).await {
            error!("Failed to initialize database tables: {}", e);
            return Err(Error::other(format!("Database initialization failed: {}", e)));
        }
        
        // Initialize root user
        let root_user = config.server.as_ref()
            .and_then(|s| s.root_user.as_deref())
            .unwrap_or("nebulafxadmin");
        let root_password = config.server.as_ref()
            .and_then(|s| s.root_password.as_deref())
            .unwrap_or("nebulafxadmin");
        
        if let Err(e) = init_root_user(pool.inner(), root_user, root_password).await {
            error!("Failed to initialize root user: {}", e);
            return Err(Error::other(format!("Root user initialization failed: {}", e)));
        }
    }

    // Initialize performance profiling if enabled
    match init_profiling(config.profiling.as_ref()).await {
        Ok(s) => info!("Profiling initialized successfully: {}", s),
        Err(e) => {
            error!("Failed to initialize profiling: {}", e);
            return Err(Error::other(format!("Failed to initialize profiling: {}", e)));
        }
    }
    // Run with config
    match run(config).await {
        Ok(_) => Ok(()),
        Err(e) => {
            error!("Server encountered an error and is shutting down: {}", e);
            Err(e)
        }
    }
}

#[instrument(skip(config))]
async fn run(config: &Config) -> Result<()> {
    debug!("config: {:?}", config);

    // Get server config
    let server_config = config.server.as_ref().ok_or_else(|| Error::other("Server config not found"))?;
    
    if let Some(region) = &server_config.region {
        nebulafx_ecstore::global::set_global_region(region.clone());
    }

    let address = format!("{}:{}", 
        server_config.host.as_deref().unwrap_or("0.0.0.0"),
        server_config.port.unwrap_or(9000)
    );
    let server_addr = parse_and_resolve_address(address.as_str()).map_err(Error::other)?;
    let server_port = server_addr.port();
    let server_address = server_addr.to_string();

    // Set up AK and SK
    nebulafx_ecstore::global::init_global_action_credentials(
        server_config.access_key.clone(),
        server_config.secret_key.clone()
    );

    set_global_nebulafx_port(server_port);

    set_global_addr(&address).await;

    // For RPC
    let volumes_str = server_config.volumes.as_deref().unwrap_or("/deploy/data/dev{1...8}");
    // Split volumes string by whitespace into Vec<String>
    let volumes: Vec<String> = volumes_str.split_whitespace().map(|s| s.to_string()).collect();
    let (endpoint_pools, setup_type) = EndpointServerPools::from_volumes(server_address.clone().as_str(), volumes)
        .await
        .map_err(Error::other)?;

    for (i, eps) in endpoint_pools.as_ref().iter().enumerate() {
        info!(
            target: "nebulafx::main::run",
            "Formatting {}st pool, {} set(s), {} drives per set.",
            i + 1,
            eps.set_count,
            eps.drives_per_set
        );

        if eps.drives_per_set > 1 {
            warn!(target: "nebulafx::main::run","WARNING: Host local has more than 0 drives of set. A host failure will result in data becoming unavailable.");
        }
    }

    for (i, eps) in endpoint_pools.as_ref().iter().enumerate() {
        info!(
            target: "nebulafx::main::run",
            id = i,
            set_count = eps.set_count,
            drives_per_set = eps.drives_per_set,
            cmd = ?eps.cmd_line,
            "created endpoints {}, set_count:{}, drives_per_set: {}, cmd: {:?}",
            i, eps.set_count, eps.drives_per_set, eps.cmd_line
        );

        for ep in eps.endpoints.as_ref().iter() {
            info!(
                target: "nebulafx::main::run",
                "  - endpoint: {}", ep
            );
        }
    }

    let state_manager = ServiceStateManager::new();
    // Update service status to Starting
    state_manager.update(ServiceState::Starting);

    // 启动主 HTTP 服务器（包含 S3 API 和 Console API 端点）
    // 前端独立运行，不再需要独立的 Console 服务器
    let s3_shutdown_tx = {
        let s3_shutdown_tx = start_http_server(config, state_manager.clone()).await?;
        Some(s3_shutdown_tx)
    };

    set_global_endpoints(endpoint_pools.as_ref().clone());
    update_erasure_type(setup_type).await;

    // Initialize the local disk
    init_local_disks(endpoint_pools.clone()).await.map_err(Error::other)?;

    let ctx = CancellationToken::new();

    // init store
    let store = ECStore::new(server_addr, endpoint_pools.clone(), ctx.clone())
        .await
        .inspect_err(|err| {
            error!("ECStore::new {:?}", err);
        })?;

    ecconfig::init();
    // config system configuration
    GLOBAL_CONFIG_SYS.init(store.clone()).await?;

    // init  replication_pool
    init_background_replication(store.clone()).await;

    // Initialize event notifier
    init_event_notifier().await;
    // Start the audit system
    match start_audit_system().await {
        Ok(_) => info!(target: "nebulafx::main::run","Audit system started successfully."),
        Err(e) => error!(target: "nebulafx::main::run","Failed to start audit system: {}", e),
    }

    let buckets_list = store
        .list_bucket(&BucketOptions {
            no_metadata: true,
            ..Default::default()
        })
        .await
        .map_err(Error::other)?;

    // Collect bucket names into a vector
    let buckets: Vec<String> = buckets_list.into_iter().map(|v| v.name).collect();

    if let Some(pool) = GLOBAL_REPLICATION_POOL.get() {
        pool.clone().init_resync(ctx.clone(), buckets.clone()).await?;
    }

    init_bucket_metadata_sys(store.clone(), buckets.clone()).await;

    // Initialize IAM system with database pool
    if let Some(db_config) = config.database.as_ref() {
        let pool = PostgreSQLPool::get()
            .map_err(|e| Error::other(format!("Failed to get database pool: {}", e)))?;
        init_iam_sys(pool.inner().clone()).await.map_err(Error::other)?;
    } else {
        warn!("Database not configured, IAM system will not be initialized");
    }

    add_bucket_notification_configuration(buckets.clone()).await;

    // Initialize the global notification system
    new_global_notification_sys(endpoint_pools.clone()).await.map_err(|err| {
        error!("new_global_notification_sys failed {:?}", &err);
        Error::other(err)
    })?;

    // Create a cancellation token for AHM services
    let _ = create_ahm_services_cancel_token();

    // Check environment variables to determine if scanner and heal should be enabled
    let enable_scanner = parse_bool_env_var("NEUBULAFX_ENABLE_SCANNER", true);
    let enable_heal = parse_bool_env_var("NEUBULAFX_ENABLE_HEAL", true);

    info!(
        target: "nebulafx::main::run",
        enable_scanner = enable_scanner,
        enable_heal = enable_heal,
        "Background services configuration: scanner={}, heal={}", enable_scanner, enable_heal
    );

    // Initialize heal manager and scanner based on environment variables
    if enable_heal || enable_scanner {
        if enable_heal {
            // Initialize heal manager with channel processor
            let heal_storage = Arc::new(ECStoreHealStorage::new(store.clone()));
            let heal_manager = init_heal_manager(heal_storage, None).await?;

            if enable_scanner {
                info!(target: "nebulafx::main::run","Starting scanner with heal manager...");
                let scanner = Scanner::new(Some(ScannerConfig::default()), Some(heal_manager));
                scanner.start().await?;
            } else {
                info!(target: "nebulafx::main::run","Scanner disabled, but heal manager is initialized and available");
            }
        } else if enable_scanner {
            info!("Starting scanner without heal manager...");
            let scanner = Scanner::new(Some(ScannerConfig::default()), None);
            scanner.start().await?;
        }
    } else {
        info!(target: "nebulafx::main::run","Both scanner and heal are disabled, skipping AHM service initialization");
    }

    // Perform hibernation for 1 second
    tokio::time::sleep(SHUTDOWN_TIMEOUT).await;
    // listen to the shutdown signal
    match wait_for_shutdown().await {
        #[cfg(unix)]
        ShutdownSignal::CtrlC | ShutdownSignal::Sigint | ShutdownSignal::Sigterm => {
            handle_shutdown(&state_manager, s3_shutdown_tx, ctx.clone()).await;
        }
        #[cfg(not(unix))]
        ShutdownSignal::CtrlC => {
            handle_shutdown(&state_manager, s3_shutdown_tx, ctx.clone()).await;
        }
    }

    info!(target: "nebulafx::main::run","server is stopped state: {:?}", state_manager.current_state());
    Ok(())
}

/// Parse a boolean environment variable with default value
///
/// Returns true if the environment variable is not set or set to true/1/yes/on/enabled,
/// false if set to false/0/no/off/disabled
fn parse_bool_env_var(var_name: &str, default: bool) -> bool {
    env::var(var_name)
        .unwrap_or_else(|_| default.to_string())
        .parse::<bool>()
        .unwrap_or(default)
}

/// Handles the shutdown process of the server
async fn handle_shutdown(
    state_manager: &ServiceStateManager,
    s3_shutdown_tx: Option<tokio::sync::broadcast::Sender<()>>,
    ctx: CancellationToken,
) {
    ctx.cancel();

    info!(
        target: "nebulafx::main::handle_shutdown",
        "Shutdown signal received in main thread"
    );
    // update the status to stopping first
    state_manager.update(ServiceState::Stopping);

    // Check environment variables to determine what services need to be stopped
    let enable_scanner = parse_bool_env_var("NEUBULAFX_ENABLE_SCANNER", true);
    let enable_heal = parse_bool_env_var("NEUBULAFX_ENABLE_HEAL", true);

    // Stop background services based on what was enabled
    if enable_scanner || enable_heal {
        info!(
            target: "nebulafx::main::handle_shutdown",
            "Stopping background services (data scanner and auto heal)..."
        );
        shutdown_background_services();

        info!(
            target: "nebulafx::main::handle_shutdown",
            "Stopping AHM services..."
        );
        shutdown_ahm_services();
    } else {
        info!(
            target: "nebulafx::main::handle_shutdown",
            "Background services were disabled, skipping AHM shutdown"
        );
    }

    // Stop the notification system
    info!(
        target: "nebulafx::main::handle_shutdown",
        "Shutting down event notifier system..."
    );
    shutdown_event_notifier().await;

    // Stop the audit system
    info!(
        target: "nebulafx::main::handle_shutdown",
        "Stopping audit system..."
    );
    match stop_audit_system().await {
        Ok(_) => info!("Audit system stopped successfully."),
        Err(e) => error!("Failed to stop audit system: {}", e),
    }

    info!(
        target: "nebulafx::main::handle_shutdown",
        "Server is stopping..."
    );
    if let Some(s3_shutdown_tx) = s3_shutdown_tx {
        let _ = s3_shutdown_tx.send(());
    }
    // 已移除：不再需要独立的 Console 服务器关闭逻辑

    // Wait for the worker thread to complete the cleaning work
    tokio::time::sleep(SHUTDOWN_TIMEOUT).await;

    // the last updated status is stopped
    state_manager.update(ServiceState::Stopped);
    info!(
        target: "nebulafx::main::handle_shutdown",
        "Server stopped current "
    );
    println!("Server stopped successfully.");
}


#[instrument(skip_all)]
async fn add_bucket_notification_configuration(buckets: Vec<String>) {
    let region_opt = nebulafx_ecstore::global::get_global_region();
    let region = match region_opt {
        Some(ref r) if !r.is_empty() => r,
        _ => {
            warn!("Global region is not set; attempting notification configuration for all buckets with an empty region.");
            ""
        }
    };
    for bucket in buckets.iter() {
        let has_notification_config = metadata_sys::get_notification_config(bucket).await.unwrap_or_else(|err| {
            warn!("get_notification_config err {:?}", err);
            None
        });

        match has_notification_config {
            Some(cfg) => {
                info!(
                    target: "nebulafx::main::add_bucket_notification_configuration",
                    bucket = %bucket,
                    "Bucket '{}' has existing notification configuration: {:?}", bucket, cfg);

                let mut event_rules = Vec::new();
                process_queue_configurations(&mut event_rules, cfg.queue_configurations.clone(), TargetID::from_str);
                process_topic_configurations(&mut event_rules, cfg.topic_configurations.clone(), TargetID::from_str);
                process_lambda_configurations(&mut event_rules, cfg.lambda_function_configurations.clone(), TargetID::from_str);

                if let Err(e) = notifier_global::add_event_specific_rules(bucket, region, &event_rules)
                    .await
                    .map_err(|e| s3_error!(InternalError, "Failed to add rules: {e}"))
                {
                    error!("Failed to add rules for bucket '{}': {:?}", bucket, e);
                }
            }
            None => {
                info!(
                    target: "nebulafx::main::add_bucket_notification_configuration",
                    bucket = %bucket,
                    "Bucket '{}' has no existing notification configuration.", bucket);
            }
        }
    }
}

