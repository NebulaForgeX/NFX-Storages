use thiserror::Error;

#[derive(Debug, Error)]
pub enum TomlConfigError {
    #[error("Failed to read TOML file: {0}")]
    Io(#[from] std::io::Error),

    #[error("Failed to parse TOML: {0}")]
    Parse(#[from] toml::de::Error),

    #[error("Failed to serialize TOML: {0}")]
    Serialize(#[from] toml::ser::Error),

    #[error("Configuration file not found: {0}")]
    NotFound(String),

    #[error("Invalid configuration path: {0}")]
    InvalidPath(String),

    #[error("Config already initialized")] 
    AlreadyInitialized,
}

pub type Result<T> = std::result::Result<T, TomlConfigError>;
