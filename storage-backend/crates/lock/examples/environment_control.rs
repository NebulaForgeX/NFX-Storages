

//! Example demonstrating environment variable control of lock system

use nebulafx_lock::{LockManager, get_global_lock_manager};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let manager = get_global_lock_manager();

    println!("Lock system status: {}", if manager.is_disabled() { "DISABLED" } else { "ENABLED" });

    match std::env::var("NEUBULAFX_ENABLE_LOCKS") {
        Ok(value) => println!("NEUBULAFX_ENABLE_LOCKS set to: {value}"),
        Err(_) => println!("NEUBULAFX_ENABLE_LOCKS not set (defaults to enabled)"),
    }

    // Test acquiring a lock
    let result = manager.acquire_read_lock("test-bucket", "test-object", "test-owner").await;
    match result {
        Ok(guard) => {
            println!("Lock acquired successfully! Disabled: {}", guard.is_disabled());
        }
        Err(e) => {
            println!("Failed to acquire lock: {e:?}");
        }
    }

    println!("Environment control example completed");
    Ok(())
}
