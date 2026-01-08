use thiserror::Error;

#[derive(Debug, Error)]
pub enum PostgreSQLError {
    #[error("Connection failed: {0}")]
    ConnectionFailed(String),
    
    #[error("Configuration error: {0}")]
    ConfigurationError(String),
    
    #[error("Query execution failed: {0}")]
    QueryError(String),
    
    #[error("Pool error: {0}")]
    PoolError(String),
}

pub type Result<T> = std::result::Result<T, PostgreSQLError>;

