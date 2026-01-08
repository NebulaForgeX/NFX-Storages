

pub mod config;
pub mod s3_client;
pub mod server;

pub use config::Config;
pub use s3_client::{BucketInfo, S3Client};
pub use server::NEUBULAFXMcpServer;

use anyhow::{Context, Result};
use rmcp::ServiceExt;
use tokio::io::{stdin, stdout};
use tracing::info;

/// Run the MCP server with the provided configuration
pub async fn run_server_with_config(config: Config) -> Result<()> {
    info!("Starting NebulaFX MCP Server with provided configuration");

    config.validate().context("Configuration validation failed")?;

    let server = NEUBULAFXMcpServer::new(config).await?;

    info!("Running MCP server with stdio transport");

    // Run the server with stdio
    server
        .serve((stdin(), stdout()))
        .await
        .context("Failed to serve MCP server")?
        .waiting()
        .await
        .context("Error while waiting for server shutdown")?;

    Ok(())
}

/// Run the MCP server with default configuration (from environment variables)
pub async fn run_server() -> Result<()> {
    info!("Starting NebulaFX MCP Server with default configuration");

    let config = Config::default();
    run_server_with_config(config).await
}

/// Validate environment configuration (legacy function for backward compatibility)
pub fn validate_environment() -> Result<()> {
    use std::env;

    if env::var("AWS_ACCESS_KEY_ID").is_err() {
        anyhow::bail!("AWS_ACCESS_KEY_ID environment variable is required");
    }

    if env::var("AWS_SECRET_ACCESS_KEY").is_err() {
        anyhow::bail!("AWS_SECRET_ACCESS_KEY environment variable is required");
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_config_creation() {
        let config = Config {
            access_key_id: Some("test_key".to_string()),
            secret_access_key: Some("test_secret".to_string()),
            ..Config::default()
        };

        assert!(config.validate().is_ok());
        assert_eq!(config.access_key_id(), "test_key");
        assert_eq!(config.secret_access_key(), "test_secret");
    }

    #[tokio::test]
    async fn test_run_server_with_invalid_config() {
        let config = Config::default();

        let result = run_server_with_config(config).await;
        assert!(result.is_err());
    }
}
