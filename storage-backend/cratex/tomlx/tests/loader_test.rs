// Copyright 2024 NebulaFX Team
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

use nebulafx_tomlx::{load_config_from_str, TomlConfigError};
use serde::Deserialize;

#[derive(Debug, Deserialize, PartialEq)]
struct TestConfig {
    server: ServerConfig,
    database: DatabaseConfig,
}

#[derive(Debug, Deserialize, PartialEq)]
struct ServerConfig {
    host: String,
    port: u16,
}

#[derive(Debug, Deserialize, PartialEq)]
struct DatabaseConfig {
    host: String,
    port: u16,
    connection: ConnectionConfig,
}

#[derive(Debug, Deserialize, PartialEq)]
struct ConnectionConfig {
    timeout: String,
    max_retries: u32,
}

#[test]
fn test_load_nested_config() {
    let toml_content = r#"
[server]
host = "0.0.0.0"
port = 9000

[database]
host = "localhost"
port = 5432

[database.connection]
timeout = "5s"
max_retries = 5
"#;

    let config: TestConfig = load_config_from_str(toml_content).unwrap();

    assert_eq!(config.server.host, "0.0.0.0");
    assert_eq!(config.server.port, 9000);
    assert_eq!(config.database.host, "localhost");
    assert_eq!(config.database.port, 5432);
    assert_eq!(config.database.connection.timeout, "5s");
    assert_eq!(config.database.connection.max_retries, 5);
}

#[test]
fn test_load_simple_config() {
    let toml_content = r#"
host = "127.0.0.1"
port = 8080
"#;

    let config: ServerConfig = load_config_from_str(toml_content).unwrap();

    assert_eq!(config.host, "127.0.0.1");
    assert_eq!(config.port, 8080);
}

#[test]
fn test_load_config_with_optional_fields() {
    #[derive(Debug, Deserialize, PartialEq)]
    struct OptionalConfig {
        required: String,
        optional: Option<String>,
    }

    let toml_content = r#"
required = "value"
"#;

    let config: OptionalConfig = load_config_from_str(toml_content).unwrap();
    assert_eq!(config.required, "value");
    assert_eq!(config.optional, None);

    let toml_content_with_optional = r#"
required = "value"
optional = "optional_value"
"#;

    let config: OptionalConfig = load_config_from_str(toml_content_with_optional).unwrap();
    assert_eq!(config.required, "value");
    assert_eq!(config.optional, Some("optional_value".to_string()));
}

#[test]
fn test_load_config_with_default_values() {
    #[derive(Debug, Deserialize, PartialEq)]
    struct ConfigWithDefaults {
        #[serde(default = "default_port")]
        port: u16,
        #[serde(default)]
        enabled: bool,
    }

    fn default_port() -> u16 {
        8080
    }

    let toml_content = r#"
enabled = true
"#;

    let config: ConfigWithDefaults = load_config_from_str(toml_content).unwrap();
    assert_eq!(config.port, 8080); // default value
    assert_eq!(config.enabled, true);

    let toml_content_empty = r#""#;
    let config: ConfigWithDefaults = load_config_from_str(toml_content_empty).unwrap();
    assert_eq!(config.port, 8080);
    assert_eq!(config.enabled, false); // default for bool
}

#[test]
fn test_load_config_error_invalid_toml() {
    let invalid_toml = r#"
[server
host = "0.0.0.0"  # missing closing bracket
"#;

    let result: Result<ServerConfig, TomlConfigError> = load_config_from_str(invalid_toml);
    assert!(result.is_err());
    match result {
        Err(TomlConfigError::Parse(_)) => {}
        _ => panic!("Expected Parse error"),
    }
}

#[test]
fn test_load_config_error_missing_field() {
    let incomplete_toml = r#"
[server]
host = "0.0.0.0"
# port is missing
"#;

    let result: Result<ServerConfig, TomlConfigError> = load_config_from_str(incomplete_toml);
    assert!(result.is_err());
}

#[test]
fn test_load_config_with_array() {
    #[derive(Debug, Deserialize, PartialEq)]
    struct ConfigWithArray {
        servers: Vec<String>,
        ports: Vec<u16>,
    }

    let toml_content = r#"
servers = ["server1", "server2", "server3"]
ports = [8080, 8081, 8082]
"#;

    let config: ConfigWithArray = load_config_from_str(toml_content).unwrap();
    assert_eq!(config.servers, vec!["server1", "server2", "server3"]);
    assert_eq!(config.ports, vec![8080, 8081, 8082]);
}

#[test]
fn test_load_config_with_nested_tables() {
    #[derive(Debug, Deserialize, PartialEq)]
    struct Config {
        app: AppConfig,
    }

    #[derive(Debug, Deserialize, PartialEq)]
    struct AppConfig {
        name: String,
        database: DatabaseConfig,
        cache: CacheConfig,
    }

    #[derive(Debug, Deserialize, PartialEq)]
    struct CacheConfig {
        host: String,
        port: u16,
    }

    let toml_content = r#"
[app]
name = "MyApp"

[app.database]
host = "localhost"
port = 5432
connection = { timeout = "5s", max_retries = 5 }

[app.cache]
host = "redis"
port = 6379
"#;

    let config: Config = load_config_from_str(toml_content).unwrap();
    assert_eq!(config.app.name, "MyApp");
    assert_eq!(config.app.database.host, "localhost");
    assert_eq!(config.app.database.port, 5432);
    assert_eq!(config.app.cache.host, "redis");
    assert_eq!(config.app.cache.port, 6379);
}

