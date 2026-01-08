

pub mod arn;
mod check;
pub mod error;
mod event_name;
pub mod store;
pub mod target;

pub use check::check_mqtt_broker_available;
pub use error::{StoreError, TargetError};
pub use event_name::EventName;
use serde::{Deserialize, Serialize};
pub use target::Target;

/// Represents a log of events for sending to targets
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TargetLog<E> {
    /// The event name
    pub event_name: EventName,
    /// The object key
    pub key: String,
    /// The list of events
    pub records: Vec<E>,
}
