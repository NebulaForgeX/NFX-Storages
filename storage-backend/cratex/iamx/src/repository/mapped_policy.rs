use crate::entity::MappedPolicyEntity;
use crate::types::{MappedPolicy, UserType};
use sqlx::PgPool;
use std::collections::HashMap;

/// Repository for mapped policy database operations
pub struct MappedPolicyRepository;

impl MappedPolicyRepository {
    /// Find mapped policy
    pub async fn find(
        pool: &PgPool,
        name: &str,
        user_type: UserType,
        is_group: bool,
    ) -> Result<Option<MappedPolicy>, sqlx::Error> {
        let user_type_str = match user_type {
            UserType::Svc => "Svc",
            UserType::Sts => "Sts",
            UserType::Reg => "Reg",
            UserType::None => "None",
        };

        let entity = sqlx::query_as::<_, MappedPolicyEntity>(
            "SELECT id, name, user_type, is_group, policies, version, updated_at FROM mapped_policies WHERE name = $1 AND user_type = $2 AND is_group = $3"
        )
        .bind(name)
        .bind(user_type_str)
        .bind(is_group)
        .fetch_optional(pool)
        .await?;

        match entity {
            Some(e) => Ok(Some(MappedPolicy {
                version: e.version,
                policies: e.policies,
                update_at: time::OffsetDateTime::from_unix_timestamp(e.updated_at.timestamp()).unwrap_or_else(|_| time::OffsetDateTime::now_utc()),
            })),
            None => Ok(None),
        }
    }

    /// Save or update mapped policy
    pub async fn save(
        pool: &PgPool,
        name: &str,
        user_type: UserType,
        is_group: bool,
        mapped_policy: &MappedPolicy,
    ) -> Result<(), sqlx::Error> {
        let user_type_str = match user_type {
            UserType::Svc => "Svc",
            UserType::Sts => "Sts",
            UserType::Reg => "Reg",
            UserType::None => "None",
        };

        sqlx::query(
            r#"
            INSERT INTO mapped_policies (name, user_type, is_group, policies, version)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (name, user_type, is_group) DO UPDATE SET
                policies = EXCLUDED.policies,
                version = EXCLUDED.version,
                updated_at = NOW()
            "#
        )
        .bind(name)
        .bind(user_type_str)
        .bind(is_group)
        .bind(&mapped_policy.policies)
        .bind(mapped_policy.version)
        .execute(pool)
        .await?;

        Ok(())
    }

    /// Delete mapped policy
    pub async fn delete(
        pool: &PgPool,
        name: &str,
        user_type: UserType,
        is_group: bool,
    ) -> Result<bool, sqlx::Error> {
        let user_type_str = match user_type {
            UserType::Svc => "Svc",
            UserType::Sts => "Sts",
            UserType::Reg => "Reg",
            UserType::None => "None",
        };

        let rows_affected = sqlx::query(
            "DELETE FROM mapped_policies WHERE name = $1 AND user_type = $2 AND is_group = $3"
        )
        .bind(name)
        .bind(user_type_str)
        .bind(is_group)
        .execute(pool)
        .await?
        .rows_affected();

        Ok(rows_affected > 0)
    }

    /// List all mapped policies for a user type and group flag
    pub async fn list_all(
        pool: &PgPool,
        user_type: UserType,
        is_group: bool,
    ) -> Result<HashMap<String, MappedPolicy>, sqlx::Error> {
        let user_type_str = match user_type {
            UserType::Svc => "Svc",
            UserType::Sts => "Sts",
            UserType::Reg => "Reg",
            UserType::None => "None",
        };

        let entities = sqlx::query_as::<_, MappedPolicyEntity>(
            "SELECT id, name, user_type, is_group, policies, version, updated_at FROM mapped_policies WHERE user_type = $1 AND is_group = $2"
        )
        .bind(user_type_str)
        .bind(is_group)
        .fetch_all(pool)
        .await?;

        let mut result = HashMap::new();
        for entity in entities {
            result.insert(entity.name, MappedPolicy {
                version: entity.version,
                policies: entity.policies,
                update_at: time::OffsetDateTime::from_unix_timestamp(entity.updated_at.timestamp()).unwrap_or_else(|_| time::OffsetDateTime::now_utc()),
            });
        }

        Ok(result)
    }

    /// Load a single mapped policy into HashMap
    pub async fn load_mapped_policy(
        pool: &PgPool,
        name: &str,
        user_type: UserType,
        is_group: bool,
        m: &mut HashMap<String, MappedPolicy>,
    ) -> Result<(), sqlx::Error> {
        if let Some(mapped_policy) = Self::find(pool, name, user_type, is_group).await? {
            m.insert(name.to_string(), mapped_policy);
        }
        Ok(())
    }

    /// Load all mapped policies for a user type and group flag into HashMap
    pub async fn load_mapped_policies(
        pool: &PgPool,
        user_type: UserType,
        is_group: bool,
        m: &mut HashMap<String, MappedPolicy>,
    ) -> Result<(), sqlx::Error> {
        let all_policies = Self::list_all(pool, user_type, is_group).await?;
        m.extend(all_policies);
        Ok(())
    }
}

