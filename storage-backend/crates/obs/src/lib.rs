

//! # NebulaFX Observability
//!
//! provides tools for system and service monitoring
//!
//! ## feature mark
//! - `default`: default monitoring function
//! - `gpu`: gpu monitoring function
//! - `full`: includes all functions
//!
//! to enable gpu monitoring add in cargo toml
//!
//! ```toml
//! # using gpu monitoring
//! nebulafx-obs = { version = "0.1.0", features = ["gpu"] }
//!
//! # use all functions
//! nebulafx-obs = { version = "0.1.0", features = ["full"] }
//! ```
///
/// ## Usage
///
/// ```no_run
/// use nebulafx_obs::{init_obs, ObservabilityConfig};
///
/// # fn main() {
/// #   match init_obs(ObservabilityConfig::default()) {
/// #         Ok(_) => {}
/// #         Err(e) => {
/// #             panic!("Failed to initialize observability: {:?}", e);
/// #         }
/// #     };
/// #   // Application logic here
/// #   // The guard is automatically stored globally and will be dropped when the program exits
/// # }
/// ```
mod config;
mod error;
mod global;
mod telemetry;

pub use config::{ObservabilityConfig, is_production_environment};
pub use error::*;
pub use global::*;
pub use telemetry::LoggingGuard;
