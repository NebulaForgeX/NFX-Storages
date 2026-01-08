//! # NebulaFX Tokiox
//!
//! Tokio runtime configuration and builder for NebulaFX.
//!
//! This crate provides a convenient way to configure and create Tokio runtime instances
//! with support for TOML configuration files and environment variables.
//!
//! ## Usage
//!
//! ```no_run
//! use nebulafx_tokiox::{get_tokio_runtime_builder, RuntimeConfig};
//!
//! // Using default configuration
//! let builder = get_tokio_runtime_builder(None);
//! let runtime = builder.build().unwrap();
//!
//! // Using custom configuration
//! let config = RuntimeConfig {
//!     worker_threads: Some(8),
//!     ..Default::default()
//! };
//! let builder = get_tokio_runtime_builder(Some(&config));
//! let runtime = builder.build().unwrap();
//! ```

mod config;
mod runtime;

pub use config::RuntimeConfig;
pub use runtime::get_tokio_runtime_builder;

