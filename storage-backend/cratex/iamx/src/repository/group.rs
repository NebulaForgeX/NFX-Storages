use crate::entity::GroupEntity;
use crate::types::GroupInfo;
use sqlx::PgPool;
use std::collections::HashMap;

/// Repository for group database operations
pub struct GroupRepository;

impl GroupRepository {
    /// Find group by name
    pub async fn find_by_name(pool: &PgPool, name: &str) -> Result<Option<GroupInfo>, sqlx::Error> {
        let entity = sqlx::query_as::<_, GroupEntity>(
            "SELECT id, name, status, members, version, created_at, updated_at FROM groups WHERE name = $1"
        )
        .bind(name)
        .fetch_optional(pool)
        .await?;

        match entity {
            Some(e) => {
                let members: Vec<String> = serde_json::from_value(e.members)
                    .map_err(|e| sqlx::Error::Decode(Box::new(e)))?;
                Ok(Some(GroupInfo {
                    version: e.version,
                    status: e.status,
                    members,
                    update_at: Some(time::OffsetDateTime::from_unix_timestamp(e.updated_at.timestamp()).unwrap_or_else(|_| time::OffsetDateTime::now_utc())),
                }))
            }
            None => Ok(None),
        }
    }

    /// Save or update group
    pub async fn save(pool: &PgPool, name: &str, group_info: &GroupInfo) -> Result<(), sqlx::Error> {
        let members_json = serde_json::to_value(&group_info.members)
            .map_err(|e| sqlx::Error::Decode(Box::new(e)))?;

        sqlx::query(
            r#"
            INSERT INTO groups (name, status, members, version)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (name) DO UPDATE SET
                status = EXCLUDED.status,
                members = EXCLUDED.members,
                version = EXCLUDED.version,
                updated_at = NOW()
            "#
        )
        .bind(name)
        .bind(&group_info.status)
        .bind(members_json)
        .bind(group_info.version)
        .execute(pool)
        .await?;

        Ok(())
    }

    /// Delete group by name
    pub async fn delete(pool: &PgPool, name: &str) -> Result<bool, sqlx::Error> {
        let rows_affected = sqlx::query("DELETE FROM groups WHERE name = $1")
            .bind(name)
            .execute(pool)
            .await?
            .rows_affected();

        Ok(rows_affected > 0)
    }

    /// List all groups
    pub async fn list_all(pool: &PgPool) -> Result<HashMap<String, GroupInfo>, sqlx::Error> {
        let entities = sqlx::query_as::<_, GroupEntity>(
            "SELECT id, name, status, members, version, created_at, updated_at FROM groups"
        )
        .fetch_all(pool)
        .await?;

        let mut result = HashMap::new();
        for entity in entities {
            let members: Vec<String> = serde_json::from_value(entity.members)
                .map_err(|e| sqlx::Error::Decode(Box::new(e)))?;
            result.insert(entity.name, GroupInfo {
                version: entity.version,
                status: entity.status,
                members,
                update_at: Some(time::OffsetDateTime::from_unix_timestamp(entity.updated_at.timestamp()).unwrap_or_else(|_| time::OffsetDateTime::now_utc())),
            });
        }

        Ok(result)
    }

    /// Load a single group into HashMap
    pub async fn load_group(
        pool: &PgPool,
        name: &str,
        m: &mut HashMap<String, GroupInfo>,
    ) -> Result<(), sqlx::Error> {
        if let Some(group_info) = Self::find_by_name(pool, name).await? {
            m.insert(name.to_string(), group_info);
        }
        Ok(())
    }

    /// Load all groups into HashMap
    pub async fn load_groups(
        pool: &PgPool,
        m: &mut HashMap<String, GroupInfo>,
    ) -> Result<(), sqlx::Error> {
        let all_groups = Self::list_all(pool).await?;
        m.extend(all_groups);
        Ok(())
    }
}

