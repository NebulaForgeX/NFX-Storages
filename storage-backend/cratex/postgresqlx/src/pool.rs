use crate::{PostgreSQLConfig, PostgreSQLError, Result};
use sqlx::PgPool;
use std::fmt;
use std::sync::Arc;
use tokio::sync::OnceCell;

static GLOBAL_POOL: OnceCell<Arc<PgPool>> = OnceCell::const_new();

/// PostgreSQL connection pool wrapper
#[derive(Clone)]
pub struct PostgreSQLPool {
    pool: Arc<PgPool>,
}

pub struct Success;

impl fmt::Display for Success {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "Success")
    }
}

impl PostgreSQLPool {
    /// Initialize the global PostgreSQL connection pool
    /// 
    /// Returns `Success` on success, or an error if initialization fails.
    /// If `config` is `None`, returns a configuration error.
    /// Use `get()` to retrieve the initialized pool instance.
    /// 
    /// This function will also create the schema if specified in config and it doesn't exist.
    pub async fn init(config: Option<&PostgreSQLConfig>) -> Result<Success> {
        let db_config = config.ok_or_else(|| {
            PostgreSQLError::ConfigurationError("Database configuration is missing. Please configure database in config.toml".to_string())
        })?;
        
        let pool = db_config.create_pool().await?;
        
        // Create schema if specified and doesn't exist
        if let Some(schema_name) = db_config.schema.as_deref() {
            let schema_sql = format!("CREATE SCHEMA IF NOT EXISTS {}", schema_name);
            if let Err(e) = sqlx::query(&schema_sql).execute(&pool).await {
                tracing::warn!("Failed to create schema '{}': {}", schema_name, e);
                // Don't fail initialization if schema creation fails (might already exist or permission issue)
            } else {
                tracing::info!("Schema '{}' created or already exists", schema_name);
            }
            
            // Set the search_path to use the schema
            let set_search_path = format!("SET search_path TO {}", schema_name);
            if let Err(e) = sqlx::query(&set_search_path).execute(&pool).await {
                tracing::warn!("Failed to set search_path to '{}': {}", schema_name, e);
            }
        }
        
        let pool_arc = Arc::new(pool);
        
        GLOBAL_POOL
            .set(pool_arc)
            .map_err(|_| PostgreSQLError::ConfigurationError("Pool already initialized".to_string()))?;

        Ok(Success)
    }

    /// Get the global PostgreSQL connection pool instance
    /// 
    /// Returns the pool instance if initialized, or an error if not initialized.
    /// Call `init()` first to initialize the pool.
    pub fn get() -> Result<Self> {
        let pool = GLOBAL_POOL
            .get()
            .ok_or_else(|| PostgreSQLError::ConfigurationError("Pool not initialized. Call init() first.".to_string()))?;
        
        Ok(Self { pool: pool.clone() })
    }

    /// Get the underlying PgPool
    pub fn inner(&self) -> &PgPool {
        &self.pool
    }

    /// Execute a query and return the number of affected rows
    pub async fn execute(&self, query: &str) -> Result<u64> {
        sqlx::query(query)
            .execute(self.inner())
            .await
            .map_err(|e| PostgreSQLError::QueryError(e.to_string()))
            .map(|r| r.rows_affected())
    }

    /// Check if the connection pool is healthy
    pub async fn health_check(&self) -> Result<bool> {
        sqlx::query("SELECT 1")
            .execute(self.inner())
            .await
            .map_err(|e| PostgreSQLError::QueryError(e.to_string()))
            .map(|_| true)
    }
}

