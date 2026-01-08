

//! NebulaFX Notify - A flexible and extensible event notification system for object storage.
//!
//! This library provides a Rust implementation of a storage bucket notification system.
//! It supports sending events to various targets
//! (like Webhook and MQTT) and includes features like event persistence and retry on failure.

mod error;
mod event;
pub mod factory;
mod global;
pub mod integration;
pub mod notifier;
pub mod registry;
pub mod rules;
pub mod stream;

pub use error::{LifecycleError, NotificationError};
pub use event::{Event, EventArgs, EventArgsBuilder};
pub use global::{initialize, is_notification_system_initialized, notification_system, notifier_global};
pub use integration::NotificationSystem;
pub use rules::BucketNotificationConfig;
