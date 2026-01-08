use crate::{PostgreSQLError, Result};
use sqlx::PgPool;
use tracing::{info, warn};

/// Execute a SQL migration script
/// 
/// # Arguments
/// * `pool` - PostgreSQL connection pool
/// * `sql` - SQL migration script to execute
/// * `description` - Optional description of the migration (for logging)
/// 
/// # Returns
/// Returns `Ok(())` on success, or an error if execution fails
pub async fn execute_migration(
    pool: &PgPool,
    sql: &str,
    description: Option<&str>,
) -> Result<()> {
    let desc = description.unwrap_or("migration");
    info!("Executing database migration: {}", desc);
    
    sqlx::query(sql)
        .execute(pool)
        .await
        .map_err(|e| {
            warn!("Migration '{}' failed: {}", desc, e);
            PostgreSQLError::QueryError(format!("Migration '{}' failed: {}", desc, e))
        })?;
    
    info!("Migration '{}' completed successfully", desc);
    Ok(())
}

/// Execute multiple SQL migration scripts in a transaction
/// 
/// # Arguments
/// * `pool` - PostgreSQL connection pool
/// * `migrations` - Vector of tuples containing (sql, description)
/// 
/// # Returns
/// Returns `Ok(())` on success, or an error if any migration fails
/// All migrations are executed in a single transaction
pub async fn execute_migrations(
    pool: &PgPool,
    migrations: Vec<(&str, Option<&str>)>,
) -> Result<()> {
    let mut tx = pool.begin().await.map_err(|e| {
        PostgreSQLError::QueryError(format!("Failed to begin transaction: {}", e))
    })?;
    
    for (sql, description) in migrations {
        let desc = description.unwrap_or("migration");
        info!("Executing database migration: {}", desc);
        
        sqlx::query(sql)
            .execute(&mut *tx)
            .await
            .map_err(|e| {
                warn!("Migration '{}' failed: {}", desc, e);
                PostgreSQLError::QueryError(format!("Migration '{}' failed: {}", desc, e))
            })?;
        
        info!("Migration '{}' completed successfully", desc);
    }
    
    tx.commit().await.map_err(|e| {
        PostgreSQLError::QueryError(format!("Failed to commit transaction: {}", e))
    })?;
    
    info!("All migrations completed successfully");
    Ok(())
}

