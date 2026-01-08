use nebulafx_audit::system::AuditSystemState;
use nebulafx_audit::{AuditError, AuditResult, audit_system, init_audit_system};
use nebulafx_config::DEFAULT_DELIMITER;
use nebulafx_ecstore::config::GLOBAL_SERVER_CONFIG;
use tracing::{info, warn};

/// Start the audit system.
/// This function checks if the audit subsystem is configured in the global server configuration.
/// If configured, it initializes and starts the audit system.
/// If not configured, it skips the initialization.
/// It also handles cases where the audit system is already running or if the global configuration is not loaded.
pub(crate) async fn start_audit_system() -> AuditResult<()> {
    info!(
        target: "nebulafx::main::start_audit_system",
        "Initializing the audit system..."
    );

    // 1. Get the global configuration loaded by ecstore
    let server_config = match GLOBAL_SERVER_CONFIG.get() {
        Some(config) => {
            info!(
                target: "nebulafx::main::start_audit_system",
                "Global server configuration loads successfully: {:?}", config
            );
            config.clone()
        }
        None => {
            warn!(
                target: "nebulafx::main::start_audit_system",
                "Audit system initialization failed: Global server configuration not loaded."
            );
            return Err(AuditError::ConfigNotLoaded);
        }
    };

    info!(
        target: "nebulafx::main::start_audit_system",
        "The global server configuration is loaded"
    );
    // 2. Check if the notify subsystem exists in the configuration, and skip initialization if it doesn't
    let mqtt_config = server_config.get_value(nebulafx_config::audit::AUDIT_MQTT_SUB_SYS, DEFAULT_DELIMITER);
    let webhook_config = server_config.get_value(nebulafx_config::audit::AUDIT_WEBHOOK_SUB_SYS, DEFAULT_DELIMITER);

    if mqtt_config.is_none() && webhook_config.is_none() {
        info!(
            target: "nebulafx::main::start_audit_system",
            "Audit subsystem (MQTT/Webhook) is not configured, and audit system initialization is skipped."
        );
        return Ok(());
    }

    info!(
        target: "nebulafx::main::start_audit_system",
        "Audit subsystem configuration detected (MQTT: {}, Webhook: {}) and started initializing the audit system.",
        mqtt_config.is_some(),
        webhook_config.is_some()
    );
    let system = init_audit_system();
    let state = system.get_state().await;
    if state == AuditSystemState::Running {
        warn!(
            target: "nebulafx::main::start_audit_system",
            "The audit system is running, skip repeated initialization."
        );
        return Err(AuditError::AlreadyInitialized);
    }
    // Preparation before starting
    match system.start(server_config).await {
        Ok(_) => {
            info!(
                target: "nebulafx::main::start_audit_system",
                "Audit system started successfully with time: {}.",
                chrono::Utc::now()
            );
            Ok(())
        }
        Err(e) => {
            warn!(
                target: "nebulafx::main::start_audit_system",
                "Audit system startup failed: {:?}",
                e
            );
            Err(e)
        }
    }
}

/// Stop the audit system.
/// This function checks if the audit system is initialized and running.
/// If it is running, it prepares to stop the system, stops it, and records the stop time.
/// If the system is already stopped or not initialized, it logs a warning and returns.
pub(crate) async fn stop_audit_system() -> AuditResult<()> {
    if let Some(system) = audit_system() {
        let state = system.get_state().await;
        if state == AuditSystemState::Stopped {
            warn!("Audit system already stopped");
            return Ok(());
        }
        // Prepare before stopping
        system.close().await?;
        // Record after stopping
        info!("Audit system stopped at {}", chrono::Utc::now());
        Ok(())
    } else {
        warn!("Audit system not initialized, cannot stop");
        Ok(())
    }
}
