mod interface;

pub use interface::*;

use std::fmt;
use std::sync::OnceLock;
use std::env;
use nebulafx_tomlx::{load_config_from_path, Result, TomlConfigError};
use tracing::error;

pub struct Success;

impl fmt::Display for Success {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "Success")
    }
}

const ENVIRONMENT: &str = "ENVIRONMENT";
const PRO_ENV: [&str; 6] = ["pro", "production", "p", "P", "PRO", "PRODUCTION"];
static CONFIG: OnceLock<Config> = OnceLock::new();

fn load_config(if_production: bool) -> Result<Config> {
    load_config_from_path(if if_production {
        "config.toml"
    } else {
        "config.dev.toml"
    }, if_production)
}

pub fn init_config() -> Result<Success> {
    let config = match load_config(env::var(ENVIRONMENT).map(|v| PRO_ENV.contains(&v.as_str())).unwrap_or(false)) {
        Ok(c) => c,
        Err(e) => {
            error!("Failed to load config: {}", e);
            return Err(e);
        }
    };
    match CONFIG.set(config) {
        Ok(_) => Ok(Success),
        Err(_) => Err(TomlConfigError::AlreadyInitialized),
    }
}

pub fn get_config() -> &'static Config {
    CONFIG.get().expect("Config not initialized. Call init_config() first.")
}

