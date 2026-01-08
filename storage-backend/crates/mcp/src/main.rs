

use anyhow::{Context, Result};
use clap::Parser;
use rmcp::ServiceExt;
use nebulafx_mcp::{Config, NEUBULAFXMcpServer};
use std::env;
use tokio::io::{stdin, stdout};
use tracing::{Level, error, info};
use tracing_subscriber::{EnvFilter, FmtSubscriber};

#[tokio::main]
async fn main() -> Result<()> {
    let config = Config::parse();

    init_tracing(&config)?;

    info!("Starting NebulaFX MCP Server v{}", env!("CARGO_PKG_VERSION"));

    if let Err(e) = config.validate() {
        error!("Configuration validation failed: {}", e);
        print_usage_help();
        std::process::exit(1);
    }

    config.log_configuration();

    if let Err(e) = run_server(config).await {
        error!("Server error: {}", e);
        std::process::exit(1);
    }

    info!("NebulaFX MCP Server shutdown complete");
    Ok(())
}

async fn run_server(config: Config) -> Result<()> {
    info!("Initializing NebulaFX MCP Server");

    let server = NEUBULAFXMcpServer::new(config).await?;

    info!("Starting MCP server with stdio transport");

    server
        .serve((stdin(), stdout()))
        .await
        .context("Failed to serve MCP server")?
        .waiting()
        .await
        .context("Error while waiting for server shutdown")?;

    Ok(())
}

fn init_tracing(config: &Config) -> Result<()> {
    let filter = EnvFilter::try_from_default_env()
        .or_else(|_| EnvFilter::try_new(&config.log_level))
        .context("Failed to create log filter")?;

    let subscriber = FmtSubscriber::builder()
        .with_max_level(Level::TRACE)
        .with_env_filter(filter)
        .with_target(false)
        .with_thread_ids(false)
        .with_thread_names(false)
        .with_writer(std::io::stderr) // Force logs to stderr to avoid interfering with MCP protocol on stdout
        .finish();

    tracing::subscriber::set_global_default(subscriber).context("Failed to set global tracing subscriber")?;

    Ok(())
}

fn print_usage_help() {
    eprintln!();
    eprintln!("NebulaFX MCP Server - Model Context Protocol server for S3 operations");
    eprintln!();
    eprintln!("For more help, run: nebulafx-mcp --help");
    eprintln!();
    eprintln!("QUICK START:");
    eprintln!("  # Using command-line arguments");
    eprintln!("  nebulafx-mcp --access-key-id YOUR_KEY --secret-access-key YOUR_SECRET");
    eprintln!();
    eprintln!("  # Using environment variables");
    eprintln!("  export AWS_ACCESS_KEY_ID=YOUR_KEY");
    eprintln!("  export AWS_SECRET_ACCESS_KEY=YOUR_SECRET");
    eprintln!("  nebulafx-mcp");
    eprintln!();
    eprintln!("  # For local development with NebulaFX");
    eprintln!("  nebulafx-mcp --access-key-id minioadmin --secret-access-key minioadmin --endpoint-url http://localhost:9000");
    eprintln!();
}
