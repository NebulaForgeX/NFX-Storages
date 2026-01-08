use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use time::OffsetDateTime;

/// User type enumeration
#[derive(Debug, PartialEq, Eq, Clone, Copy)]
pub enum UserType {
    Svc,
    Sts,
    Reg,
    None,
}

impl UserType {
    pub fn prefix(&self) -> &'static str {
        match self {
            UserType::Svc => "service-accounts/",
            UserType::Sts => "sts/",
            UserType::Reg => "users/",
            UserType::None => "",
        }
    }
    
    pub fn to_u64(&self) -> u64 {
        match self {
            UserType::Svc => 1,
            UserType::Sts => 2,
            UserType::Reg => 3,
            UserType::None => 0,
        }
    }

    pub fn from_u64(u64: u64) -> Option<Self> {
        match u64 {
            1 => Some(UserType::Svc),
            2 => Some(UserType::Sts),
            3 => Some(UserType::Reg),
            0 => Some(UserType::None),
            _ => None,
        }
    }
}

/// Mapped policy structure
#[derive(Serialize, Deserialize, Clone)]
pub struct MappedPolicy {
    pub version: i64,
    pub policies: String,
    pub update_at: OffsetDateTime,
}

impl Default for MappedPolicy {
    fn default() -> Self {
        Self {
            version: 0,
            policies: "".to_owned(),
            update_at: OffsetDateTime::now_utc(),
        }
    }
}

impl MappedPolicy {
    pub fn new(policy: &str) -> Self {
        Self {
            version: 1,
            policies: policy.to_owned(),
            update_at: OffsetDateTime::now_utc(),
        }
    }

    pub fn to_slice(&self) -> Vec<String> {
        self.policies
            .split(",")
            .filter(|v| !v.trim().is_empty())
            .map(|v| v.to_string())
            .collect()
    }

    pub fn policy_set(&self) -> HashSet<String> {
        self.policies
            .split(",")
            .filter(|v| !v.trim().is_empty())
            .map(|v| v.to_string())
            .collect()
    }
}

/// Group information structure
#[derive(Serialize, Deserialize, Clone, Debug, Default)]
pub struct GroupInfo {
    pub version: i64,
    pub status: String,
    pub members: Vec<String>,
    pub update_at: Option<OffsetDateTime>,
}

impl GroupInfo {
    pub fn new(members: Vec<String>) -> Self {
        Self {
            version: 1,
            status: "enabled".to_owned(),
            members,
            update_at: Some(OffsetDateTime::now_utc()),
        }
    }
}

