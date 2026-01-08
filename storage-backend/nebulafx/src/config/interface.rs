use serde::{Deserialize, Serialize};
pub use nebulafx_postgresqlx::PostgreSQLConfig;
pub use nebulafx_obs::ObservabilityConfig;
pub use nebulafx_profilingx::ProfilingConfig;
pub use nebulafx_tokiox::RuntimeConfig;

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct Config {
    pub server: Option<ServerConfig>,
    pub database: Option<PostgreSQLConfig>,
    pub storage: Option<StorageConfig>,
    pub tls: Option<TlsConfig>,
    pub observability: Option<ObservabilityConfig>,
    pub profiling: Option<ProfilingConfig>,
    pub runtime: Option<RuntimeConfig>,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct ServerConfig {
    pub name: Option<String>,
    pub host: Option<String>,
    pub port: Option<u16>,
    pub server_domains: Option<Vec<String>>,
    pub region: Option<String>,
    pub volumes: Option<String>,
    pub cors_allowed_origins: Option<String>,
    pub console_cors_allowed_origins: Option<String>,
    pub access_key: Option<String>,
    pub secret_key: Option<String>,
    pub root_user: Option<String>,
    pub root_password: Option<String>,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct StorageConfig {
    pub base_path: Option<String>,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct TlsConfig {
    pub path: Option<String>,
    pub key_file: Option<String>,
    pub cert_file: Option<String>,
}


