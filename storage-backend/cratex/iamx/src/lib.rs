
//! # NebulaFX IAMX (Identity and Access Management)
//! 
//! This crate provides identity and access management functionality for NebulaFX,
//! including user management, policies, groups, and permissions.

use std::sync::{Arc, OnceLock};

use crate::sys::IamSys;
use crate::error::{Error, Result};

// Core modules
pub mod error;
pub mod sys;
pub mod types;

// Database layer
pub mod entity;
pub mod repository;
pub mod migrations;
pub mod init;

// Business logic layer
pub mod manager;

// Utilities
pub mod utils;

// Re-export commonly used types
pub use types::{GroupInfo, MappedPolicy, UserType};

// Re-export repository types
pub use repository::{
    UserRepository, PolicyRepository, GroupRepository, 
    MappedPolicyRepository, UserIdentityRepository
};

// Re-export manager utils for convenience
pub use manager::utils::get_token_signing_key;

static IAM_SYS: OnceLock<Arc<IamSys>> = OnceLock::new();

/// Initialize IAM system with database connection pool
pub async fn init_iam_sys(pool: sqlx::PgPool) -> Result<()> {
    let iam_sys = Arc::new(IamSys::new(pool));
    
    IAM_SYS.set(iam_sys)
        .map_err(|_| Error::other("IAM system already initialized"))?;
    
    Ok(())
}

/// Get the global IAM system instance
#[inline]
pub fn get() -> Result<Arc<IamSys>> {
    IAM_SYS.get().map(Arc::clone).ok_or(Error::IamSysNotInitialized)
}

/// Get the global IAM system instance (returns None if not initialized)
pub fn get_global_iam_sys() -> Option<Arc<IamSys>> {
    IAM_SYS.get().cloned()
}
