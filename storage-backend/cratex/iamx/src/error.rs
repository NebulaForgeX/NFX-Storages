

use nebulafx_policy::policy::Error as PolicyError;

pub type Result<T> = core::result::Result<T, Error>;

#[derive(thiserror::Error, Debug)]
pub enum Error {
    #[error(transparent)]
    PolicyError(#[from] PolicyError),

    #[error("{0}")]
    StringError(String),

    #[error("crypto: {0}")]
    CryptoError(#[from] nebulafx_crypto::Error),

    #[error("user '{0}' does not exist")]
    NoSuchUser(String),

    #[error("account '{0}' does not exist")]
    NoSuchAccount(String),

    #[error("service account '{0}' does not exist")]
    NoSuchServiceAccount(String),

    #[error("temp account '{0}' does not exist")]
    NoSuchTempAccount(String),

    #[error("group '{0}' does not exist")]
    NoSuchGroup(String),

    #[error("policy does not exist")]
    NoSuchPolicy,

    #[error("policy in use")]
    PolicyInUse,

    #[error("group not empty")]
    GroupNotEmpty,

    #[error("invalid arguments specified")]
    InvalidArgument,

    #[error("not initialized")]
    IamSysNotInitialized,

    #[error("invalid service type: {0}")]
    InvalidServiceType(String),

    #[error("malformed credential")]
    ErrCredMalformed,

    #[error("CredNotInitialized")]
    CredNotInitialized,

    #[error("invalid access key length")]
    InvalidAccessKeyLength,

    #[error("invalid secret key length")]
    InvalidSecretKeyLength,

    #[error("access key contains reserved characters =,")]
    ContainsReservedChars,

    #[error("group name contains reserved characters =,")]
    GroupNameContainsReservedChars,

    #[error("jwt err {0}")]
    JWTError(jsonwebtoken::errors::Error),

    #[error("no access key")]
    NoAccessKey,

    #[error("invalid token")]
    InvalidToken,

    #[error("invalid access_key")]
    InvalidAccessKey,
    #[error("action not allowed")]
    IAMActionNotAllowed,

    #[error("invalid expiration")]
    InvalidExpiration,

    #[error("no secret key with access key")]
    NoSecretKeyWithAccessKey,

    #[error("no access key with secret key")]
    NoAccessKeyWithSecretKey,

    #[error("policy too large")]
    PolicyTooLarge,

    #[error("config not found")]
    ConfigNotFound,

    #[error("io error: {0}")]
    Io(std::io::Error),
}

impl PartialEq for Error {
    fn eq(&self, other: &Self) -> bool {
        match (self, other) {
            (Error::StringError(a), Error::StringError(b)) => a == b,
            (Error::NoSuchUser(a), Error::NoSuchUser(b)) => a == b,
            (Error::NoSuchAccount(a), Error::NoSuchAccount(b)) => a == b,
            (Error::NoSuchServiceAccount(a), Error::NoSuchServiceAccount(b)) => a == b,
            (Error::NoSuchTempAccount(a), Error::NoSuchTempAccount(b)) => a == b,
            (Error::NoSuchGroup(a), Error::NoSuchGroup(b)) => a == b,
            (Error::InvalidServiceType(a), Error::InvalidServiceType(b)) => a == b,
            (Error::Io(a), Error::Io(b)) => a.kind() == b.kind() && a.to_string() == b.to_string(),
            // For complex types like PolicyError, CryptoError, JWTError, compare string representations
            (a, b) => std::mem::discriminant(a) == std::mem::discriminant(b) && a.to_string() == b.to_string(),
        }
    }
}

impl Clone for Error {
    fn clone(&self) -> Self {
        match self {
            Error::PolicyError(e) => Error::StringError(e.to_string()), // Convert to string since PolicyError may not be cloneable
            Error::StringError(s) => Error::StringError(s.clone()),
            Error::CryptoError(e) => Error::StringError(format!("crypto: {e}")), // Convert to string
            Error::NoSuchUser(s) => Error::NoSuchUser(s.clone()),
            Error::NoSuchAccount(s) => Error::NoSuchAccount(s.clone()),
            Error::NoSuchServiceAccount(s) => Error::NoSuchServiceAccount(s.clone()),
            Error::NoSuchTempAccount(s) => Error::NoSuchTempAccount(s.clone()),
            Error::NoSuchGroup(s) => Error::NoSuchGroup(s.clone()),
            Error::NoSuchPolicy => Error::NoSuchPolicy,
            Error::PolicyInUse => Error::PolicyInUse,
            Error::GroupNotEmpty => Error::GroupNotEmpty,
            Error::InvalidArgument => Error::InvalidArgument,
            Error::IamSysNotInitialized => Error::IamSysNotInitialized,
            Error::InvalidServiceType(s) => Error::InvalidServiceType(s.clone()),
            Error::ErrCredMalformed => Error::ErrCredMalformed,
            Error::CredNotInitialized => Error::CredNotInitialized,
            Error::InvalidAccessKeyLength => Error::InvalidAccessKeyLength,
            Error::InvalidSecretKeyLength => Error::InvalidSecretKeyLength,
            Error::ContainsReservedChars => Error::ContainsReservedChars,
            Error::GroupNameContainsReservedChars => Error::GroupNameContainsReservedChars,
            Error::JWTError(e) => Error::StringError(format!("jwt err {e}")), // Convert to string
            Error::NoAccessKey => Error::NoAccessKey,
            Error::InvalidToken => Error::InvalidToken,
            Error::InvalidAccessKey => Error::InvalidAccessKey,
            Error::IAMActionNotAllowed => Error::IAMActionNotAllowed,
            Error::InvalidExpiration => Error::InvalidExpiration,
            Error::NoSecretKeyWithAccessKey => Error::NoSecretKeyWithAccessKey,
            Error::NoAccessKeyWithSecretKey => Error::NoAccessKeyWithSecretKey,
            Error::PolicyTooLarge => Error::PolicyTooLarge,
            Error::ConfigNotFound => Error::ConfigNotFound,
            Error::Io(e) => Error::Io(std::io::Error::new(e.kind(), e.to_string())),
        }
    }
}

impl Error {
    pub fn other<E>(error: E) -> Self
    where
        E: Into<Box<dyn std::error::Error + Send + Sync>>,
    {
        Error::Io(std::io::Error::other(error))
    }
}

impl From<nebulafx_ecstore::error::StorageError> for Error {
    fn from(e: nebulafx_ecstore::error::StorageError) -> Self {
        match e {
            nebulafx_ecstore::error::StorageError::ConfigNotFound => Error::ConfigNotFound,
            _ => Error::other(e),
        }
    }
}

impl From<Error> for nebulafx_ecstore::error::StorageError {
    fn from(e: Error) -> Self {
        match e {
            Error::ConfigNotFound => nebulafx_ecstore::error::StorageError::ConfigNotFound,
            _ => nebulafx_ecstore::error::StorageError::other(e),
        }
    }
}

impl From<nebulafx_policy::error::Error> for Error {
    fn from(e: nebulafx_policy::error::Error) -> Self {
        match e {
            nebulafx_policy::error::Error::PolicyTooLarge => Error::PolicyTooLarge,
            nebulafx_policy::error::Error::InvalidArgument => Error::InvalidArgument,
            nebulafx_policy::error::Error::InvalidServiceType(s) => Error::InvalidServiceType(s),
            nebulafx_policy::error::Error::IAMActionNotAllowed => Error::IAMActionNotAllowed,
            nebulafx_policy::error::Error::InvalidExpiration => Error::InvalidExpiration,
            nebulafx_policy::error::Error::NoAccessKey => Error::NoAccessKey,
            nebulafx_policy::error::Error::InvalidToken => Error::InvalidToken,
            nebulafx_policy::error::Error::InvalidAccessKey => Error::InvalidAccessKey,
            nebulafx_policy::error::Error::NoSecretKeyWithAccessKey => Error::NoSecretKeyWithAccessKey,
            nebulafx_policy::error::Error::NoAccessKeyWithSecretKey => Error::NoAccessKeyWithSecretKey,
            nebulafx_policy::error::Error::Io(e) => Error::Io(e),
            nebulafx_policy::error::Error::JWTError(e) => Error::JWTError(e),
            nebulafx_policy::error::Error::NoSuchUser(s) => Error::NoSuchUser(s),
            nebulafx_policy::error::Error::NoSuchAccount(s) => Error::NoSuchAccount(s),
            nebulafx_policy::error::Error::NoSuchServiceAccount(s) => Error::NoSuchServiceAccount(s),
            nebulafx_policy::error::Error::NoSuchTempAccount(s) => Error::NoSuchTempAccount(s),
            nebulafx_policy::error::Error::NoSuchGroup(s) => Error::NoSuchGroup(s),
            nebulafx_policy::error::Error::NoSuchPolicy => Error::NoSuchPolicy,
            nebulafx_policy::error::Error::PolicyInUse => Error::PolicyInUse,
            nebulafx_policy::error::Error::GroupNotEmpty => Error::GroupNotEmpty,
            nebulafx_policy::error::Error::InvalidAccessKeyLength => Error::InvalidAccessKeyLength,
            nebulafx_policy::error::Error::InvalidSecretKeyLength => Error::InvalidSecretKeyLength,
            nebulafx_policy::error::Error::ContainsReservedChars => Error::ContainsReservedChars,
            nebulafx_policy::error::Error::GroupNameContainsReservedChars => Error::GroupNameContainsReservedChars,
            nebulafx_policy::error::Error::CredNotInitialized => Error::CredNotInitialized,
            nebulafx_policy::error::Error::IamSysNotInitialized => Error::IamSysNotInitialized,
            nebulafx_policy::error::Error::PolicyError(e) => Error::PolicyError(e),
            nebulafx_policy::error::Error::StringError(s) => Error::StringError(s),
            nebulafx_policy::error::Error::CryptoError(e) => Error::CryptoError(e),
            nebulafx_policy::error::Error::ErrCredMalformed => Error::ErrCredMalformed,
        }
    }
}

impl From<Error> for std::io::Error {
    fn from(e: Error) -> Self {
        std::io::Error::other(e)
    }
}

impl From<serde_json::Error> for Error {
    fn from(e: serde_json::Error) -> Self {
        Error::other(e)
    }
}

impl From<base64_simd::Error> for Error {
    fn from(e: base64_simd::Error) -> Self {
        Error::other(e)
    }
}

pub fn is_err_config_not_found(err: &Error) -> bool {
    matches!(err, Error::ConfigNotFound)
}

// pub fn is_err_no_such_user(e: &Error) -> bool {
//     matches!(e, Error::NoSuchUser(_))
// }

pub fn is_err_no_such_policy(err: &Error) -> bool {
    matches!(err, Error::NoSuchPolicy)
}

pub fn is_err_no_such_user(err: &Error) -> bool {
    matches!(err, Error::NoSuchUser(_))
}

pub fn is_err_no_such_account(err: &Error) -> bool {
    matches!(err, Error::NoSuchAccount(_))
}

pub fn is_err_no_such_temp_account(err: &Error) -> bool {
    matches!(err, Error::NoSuchTempAccount(_))
}

pub fn is_err_no_such_group(err: &Error) -> bool {
    matches!(err, Error::NoSuchGroup(_))
}

pub fn is_err_no_such_service_account(err: &Error) -> bool {
    matches!(err, Error::NoSuchServiceAccount(_))
}