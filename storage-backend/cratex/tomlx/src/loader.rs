use crate::error::{Result, TomlConfigError};
use std::path::Path;

pub fn load_config_from_path<T>(path: impl AsRef<Path>, if_print: bool) -> Result<T> where T: serde::de::DeserializeOwned + serde::Serialize {
    let path = path.as_ref();
    
    if !path.exists() {
        return Err(TomlConfigError::NotFound(
            path.display().to_string(),
        ));
    }

    let content = std::fs::read_to_string(path).map_err(|e| TomlConfigError::Io(e))?;
    let config: T = load_config_from_str(&content)?;
    
    if if_print {
        match serde_json::to_string_pretty(&config) {
            Ok(json) => {
                println!("Loaded configuration from {} (as JSON):\n{}", path.display(), json);
            }
            Err(e) => {
                println!("Loaded configuration from {} (failed to serialize as JSON: {}):\n{}", path.display(), e, content);
            }
        }
    }
    
    Ok(config)
}

pub fn load_config_from_str<T>(content: &str) -> Result<T> where T: serde::de::DeserializeOwned {
    let config: T = toml::from_str(content).map_err(|e| TomlConfigError::Parse(e))?;
    Ok(config)
}
