use nebulafx_config::DEFAULT_DELIMITER;
use nebulafx_ecstore::config::GLOBAL_SERVER_CONFIG;
use tracing::{error, info, instrument, warn};

/// Shuts down the event notifier system gracefully
pub(crate) async fn shutdown_event_notifier() {
    info!("Shutting down event notifier system...");

    if !nebulafx_notify::is_notification_system_initialized() {
        info!("Event notifier system is not initialized, nothing to shut down.");
        return;
    }

    let system = match nebulafx_notify::notification_system() {
        Some(sys) => sys,
        None => {
            info!("Event notifier system is not initialized.");
            return;
        }
    };

    // Call the shutdown function from the nebulafx_notify module
    system.shutdown().await;
    info!("Event notifier system shut down successfully.");
}

#[instrument]
pub(crate) async fn init_event_notifier() {
    info!(
        target: "nebulafx::main::init_event_notifier",
        "Initializing event notifier..."
    );

    // 1. Get the global configuration loaded by ecstore
    let server_config = match GLOBAL_SERVER_CONFIG.get() {
        Some(config) => config.clone(), // Clone the config to pass ownership
        None => {
            warn!("Event notifier initialization failed: Global server config not loaded.");
            return;
        }
    };

    info!(
        target: "nebulafx::main::init_event_notifier",
        "Global server configuration loaded successfully"
    );
    // 2. Check if the notify subsystem exists in the configuration, and skip initialization if it doesn't
    if server_config
        .get_value(nebulafx_config::notify::NOTIFY_MQTT_SUB_SYS, DEFAULT_DELIMITER)
        .is_none()
        || server_config
            .get_value(nebulafx_config::notify::NOTIFY_WEBHOOK_SUB_SYS, DEFAULT_DELIMITER)
            .is_none()
    {
        info!(
            target: "nebulafx::main::init_event_notifier",
            "'notify' subsystem not configured, skipping event notifier initialization."
        );
        return;
    }

    info!(
        target: "nebulafx::main::init_event_notifier",
        "Event notifier configuration found, proceeding with initialization."
    );

    // 3. Initialize the notification system asynchronously with a global configuration
    // Use direct await for better error handling and faster initialization
    if let Err(e) = nebulafx_notify::initialize(server_config).await {
        error!("Failed to initialize event notifier system: {}", e);
    } else {
        info!(
            target: "nebulafx::main::init_event_notifier",
            "Event notifier system initialized successfully."
        );
    }
}
