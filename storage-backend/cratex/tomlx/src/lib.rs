mod error;
mod loader;

pub use error::{TomlConfigError, Result};
pub use loader::{load_config_from_path, load_config_from_str};

pub fn load_config<T>(path: impl AsRef<std::path::Path>, if_print: bool) -> Result<T> where T: serde::de::DeserializeOwned + serde::Serialize {
    load_config_from_path(path, if_print)
}
