use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use sqlx::FromRow;

/// User entity representing a user in the database
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct UserEntity {
    pub id: i64,
    pub access_key: String,
    pub secret_key: String,
    pub user_type: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Policy entity representing a policy document in the database
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct PolicyEntity {
    pub id: i64,
    pub name: String,
    pub policy_doc: Value, // JSONB stored as serde_json::Value
    pub version: i64,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Group entity representing a group in the database
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct GroupEntity {
    pub id: i64,
    pub name: String,
    pub status: String,
    pub members: Value, // JSONB array stored as serde_json::Value
    pub version: i64,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Mapped policy entity representing a mapped policy in the database
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct MappedPolicyEntity {
    pub id: i64,
    pub name: String,
    pub user_type: String,
    pub is_group: bool,
    pub policies: String,
    pub version: i64,
    pub updated_at: DateTime<Utc>,
}

/// User identity entity representing user identity data in the database
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct UserIdentityEntity {
    pub id: i64,
    pub name: String,
    pub user_type: String,
    pub identity_data: Value, // JSONB stored as serde_json::Value
    pub ttl: Option<i32>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

