use crate::entity::PolicyEntity;
use nebulafx_policy::policy::PolicyDoc;
use sqlx::PgPool;
use std::collections::HashMap;

/// Repository for policy database operations
pub struct PolicyRepository;

impl PolicyRepository {
    /// Find policy by name
    pub async fn find_by_name(pool: &PgPool, name: &str) -> Result<Option<PolicyDoc>, sqlx::Error> {
        let entity = sqlx::query_as::<_, PolicyEntity>(
            "SELECT id, name, policy_doc, version, created_at, updated_at FROM policies WHERE name = $1"
        )
        .bind(name)
        .fetch_optional(pool)
        .await?;

        match entity {
            Some(e) => {
                let policy_doc: PolicyDoc = serde_json::from_value(e.policy_doc)
                    .map_err(|e| sqlx::Error::Decode(Box::new(e)))?;
                Ok(Some(policy_doc))
            }
            None => Ok(None),
        }
    }

    /// Save or update policy
    pub async fn save(pool: &PgPool, name: &str, policy_doc: &PolicyDoc) -> Result<(), sqlx::Error> {
        let policy_json = serde_json::to_value(policy_doc)
            .map_err(|e| sqlx::Error::Decode(Box::new(e)))?;

        sqlx::query(
            r#"
            INSERT INTO policies (name, policy_doc, version)
            VALUES ($1, $2, $3)
            ON CONFLICT (name) DO UPDATE SET
                policy_doc = EXCLUDED.policy_doc,
                version = EXCLUDED.version,
                updated_at = NOW()
            "#
        )
        .bind(name)
        .bind(policy_json)
        .bind(policy_doc.version)
        .execute(pool)
        .await?;

        Ok(())
    }

    /// Delete policy by name
    pub async fn delete(pool: &PgPool, name: &str) -> Result<bool, sqlx::Error> {
        let rows_affected = sqlx::query("DELETE FROM policies WHERE name = $1")
            .bind(name)
            .execute(pool)
            .await?
            .rows_affected();

        Ok(rows_affected > 0)
    }

    /// List all policies
    pub async fn list_all(pool: &PgPool) -> Result<HashMap<String, PolicyDoc>, sqlx::Error> {
        let entities = sqlx::query_as::<_, PolicyEntity>(
            "SELECT id, name, policy_doc, version, created_at, updated_at FROM policies"
        )
        .fetch_all(pool)
        .await?;

        let mut result = HashMap::new();
        for entity in entities {
            let policy_doc: PolicyDoc = serde_json::from_value(entity.policy_doc)
                .map_err(|e| sqlx::Error::Decode(Box::new(e)))?;
            result.insert(entity.name, policy_doc);
        }

        Ok(result)
    }

    /// Load a single policy document into HashMap
    pub async fn load_policy_doc(
        pool: &PgPool,
        name: &str,
        m: &mut HashMap<String, PolicyDoc>,
    ) -> Result<(), sqlx::Error> {
        if let Some(policy_doc) = Self::find_by_name(pool, name).await? {
            m.insert(name.to_string(), policy_doc);
        }
        Ok(())
    }

    /// Load all policy documents into HashMap
    pub async fn load_policy_docs(
        pool: &PgPool,
        m: &mut HashMap<String, PolicyDoc>,
    ) -> Result<(), sqlx::Error> {
        let all_policies = Self::list_all(pool).await?;
        m.extend(all_policies);
        Ok(())
    }
}

