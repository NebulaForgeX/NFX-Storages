mod error;
mod pool;
mod migration;

use serde::{Deserialize, Serialize};
use sqlx::{PgPool, postgres::PgPoolOptions};
use std::time::Duration;
use tracing::{error, info};

pub use error::{PostgreSQLError, Result};
pub use pool::PostgreSQLPool;
pub use migration::{execute_migration, execute_migrations};

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct PostgreSQLConfig {
    pub host: Option<String>,
    pub port: Option<u16>,
    pub user: Option<String>,
    pub password: Option<String>,
    pub database: Option<String>,
    pub schema: Option<String>,
    pub charset: Option<String>,
    pub parse_time: Option<bool>,
    pub loc: Option<String>,
    pub logger_level: Option<String>,
    pub auto_migrate: Option<bool>,
    pub connection: Option<PostgreSQLConnectionConfig>,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct PostgreSQLConnectionConfig {
    pub timeout: Option<String>,
    pub max_retries: Option<u32>,
    pub retry_interval: Option<String>,
    pub max_idle_connections: Option<u32>,
    pub max_open_connections: Option<u32>,
    pub conn_max_idle_time: Option<String>,
    pub conn_max_lifetime: Option<String>,
}

impl PostgreSQLConfig {
    /// Build database connection URL from configuration
    pub fn build_connection_url(&self) -> Result<String> {
        let host = self.host.as_deref().unwrap_or("localhost");
        let port = self.port.unwrap_or(5432);
        let user = self.user.as_deref().unwrap_or("postgres");
        let password = self.password.as_deref().unwrap_or("");
        let database = self.database.as_deref().unwrap_or("postgres");

        Ok(format!("postgresql://{}:{}@{}:{}/{}", user, password, host, port, database))
    }

    /// Create a PostgreSQL connection pool from configuration
    pub async fn create_pool(&self) -> Result<PgPool> {
        let connection_url = self.build_connection_url()?;
        
        let connection_config = self.connection.as_ref();
        
        let timeout = connection_config
            .and_then(|c| c.timeout.as_ref())
            .and_then(|s| humantime::parse_duration(s).ok())
            .unwrap_or(Duration::from_secs(5));

        let max_connections = connection_config
            .and_then(|c| c.max_open_connections)
            .unwrap_or(100) as u32;

        let min_connections = connection_config
            .and_then(|c| c.max_idle_connections)
            .unwrap_or(10) as u32;

        let max_lifetime = connection_config
            .and_then(|c| c.conn_max_lifetime.as_ref())
            .and_then(|s| humantime::parse_duration(s).ok())
            .unwrap_or(Duration::from_secs(3600));

        let idle_timeout = connection_config
            .and_then(|c| c.conn_max_idle_time.as_ref())
            .and_then(|s| humantime::parse_duration(s).ok())
            .unwrap_or(Duration::from_secs(900));

        info!(
            "Creating PostgreSQL connection pool: host={}, database={}, max_connections={}, min_connections={}",
            self.host.as_deref().unwrap_or("localhost"),
            self.database.as_deref().unwrap_or("postgres"),
            max_connections,
            min_connections
        );

        let pool = PgPoolOptions::new()
            .max_connections(max_connections)
            .min_connections(min_connections)
            .acquire_timeout(timeout)
            .max_lifetime(max_lifetime)
            .idle_timeout(Some(idle_timeout))
            .connect(&connection_url)
            .await
            .map_err(|e| {
                error!("Failed to create PostgreSQL connection pool: {}", e);
                PostgreSQLError::ConnectionFailed(e.to_string())
            })?;

        info!("PostgreSQL connection pool created successfully");

        Ok(pool)
    }
}
