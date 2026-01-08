/// Database migration system using Refinery
/// 
/// Refinery provides:
/// - Version tracking in refinery_schema_history table
/// - Incremental migrations (ALTER TABLE, etc.)
/// - Automatic migration execution
/// 
/// Migration files should be placed in migrations/ directory
/// Format: V{version}__{name}.sql
/// Example: V1__initial_schema.sql, V2__add_user_email.sql

use refinery::embed_migrations;
use tracing::info;

// Embed migrations from migrations/ directory
embed_migrations!("migrations");

/// Run all pending migrations using Refinery's native API
/// 
/// This function uses refinery's built-in migration runner to execute migrations.
/// Refinery will handle version tracking and execution automatically.
/// 
/// # Arguments
/// * `database_url` - PostgreSQL connection string (e.g., "postgresql://user:pass@host:port/db")
/// 
/// # Returns
/// Returns `Ok(())` on success, or an error if migration fails
pub async fn run_migrations(database_url: &str) -> Result<(), Box<dyn std::error::Error>> {
    info!("Starting database migrations with Refinery...");
    
    // Use refinery's native runner with tokio-postgres
    // tokio_postgres::connect returns (Client, Connection) tuple
    let (mut client, connection) = tokio_postgres::connect(database_url, tokio_postgres::NoTls).await?;
    
    // Spawn connection task to handle the connection
    tokio::spawn(async move {
        if let Err(e) = connection.await {
            eprintln!("Connection error: {}", e);
        }
    });
    
    // Run migrations using refinery's built-in runner
    migrations::runner()
        .run_async(&mut client)
        .await?;
    
    info!("All migrations completed successfully");
    Ok(())
}


