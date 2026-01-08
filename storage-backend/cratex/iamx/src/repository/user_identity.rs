use crate::entity::UserIdentityEntity;
use crate::types::UserType;
use sqlx::PgPool;
use std::collections::HashMap;

/// Repository for user identity database operations
pub struct UserIdentityRepository;

impl UserIdentityRepository {
    /// Find user identity and deserialize to UserIdentity
    pub async fn find(
        pool: &PgPool,
        name: &str,
        user_type: UserType,
    ) -> Result<Option<nebulafx_policy::auth::UserIdentity>, sqlx::Error> {
        let user_type_str = match user_type {
            UserType::Svc => "Svc",
            UserType::Sts => "Sts",
            UserType::Reg => "Reg",
            UserType::None => "None",
        };

        let entity = sqlx::query_as::<_, UserIdentityEntity>(
            "SELECT id, name, user_type, identity_data, ttl, created_at, updated_at FROM user_identities WHERE name = $1 AND user_type = $2"
        )
        .bind(name)
        .bind(user_type_str)
        .fetch_optional(pool)
        .await?;

        match entity {
            Some(e) => {
                let user_identity: nebulafx_policy::auth::UserIdentity = serde_json::from_value(e.identity_data)
                    .map_err(|e| sqlx::Error::Decode(Box::new(e)))?;
                Ok(Some(user_identity))
            }
            None => Ok(None),
        }
    }

    /// Save or update user identity (serialize UserIdentity to JSON)
    pub async fn save(
        pool: &PgPool,
        name: &str,
        user_type: UserType,
        user_identity: &nebulafx_policy::auth::UserIdentity,
        ttl: Option<usize>,
    ) -> Result<(), sqlx::Error> {
        let user_type_str = match user_type {
            UserType::Svc => "Svc",
            UserType::Sts => "Sts",
            UserType::Reg => "Reg",
            UserType::None => "None",
        };

        let identity_json = serde_json::to_value(user_identity)
            .map_err(|e| sqlx::Error::Decode(Box::new(e)))?;

        let ttl_i32 = ttl.map(|v| v as i32);

        sqlx::query(
            r#"
            INSERT INTO user_identities (name, user_type, identity_data, ttl)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (name, user_type) DO UPDATE SET
                identity_data = EXCLUDED.identity_data,
                ttl = EXCLUDED.ttl,
                updated_at = NOW()
            "#
        )
        .bind(name)
        .bind(user_type_str)
        .bind(identity_json)
        .bind(ttl_i32)
        .execute(pool)
        .await?;

        Ok(())
    }

    /// Delete user identity
    pub async fn delete(
        pool: &PgPool,
        name: &str,
        user_type: UserType,
    ) -> Result<bool, sqlx::Error> {
        let user_type_str = match user_type {
            UserType::Svc => "Svc",
            UserType::Sts => "Sts",
            UserType::Reg => "Reg",
            UserType::None => "None",
        };

        let rows_affected = sqlx::query(
            "DELETE FROM user_identities WHERE name = $1 AND user_type = $2"
        )
        .bind(name)
        .bind(user_type_str)
        .execute(pool)
        .await?
        .rows_affected();

        Ok(rows_affected > 0)
    }

    /// Load a single user identity into HashMap
    pub async fn load_user(
        pool: &PgPool,
        name: &str,
        user_type: UserType,
        m: &mut HashMap<String, nebulafx_policy::auth::UserIdentity>,
    ) -> Result<(), sqlx::Error> {
        if let Some(user_identity) = Self::find(pool, name, user_type).await? {
            m.insert(name.to_string(), user_identity);
        }
        Ok(())
    }

    /// Load all user identities for a user type into HashMap
    pub async fn load_users(
        pool: &PgPool,
        user_type: UserType,
        m: &mut HashMap<String, nebulafx_policy::auth::UserIdentity>,
    ) -> Result<(), sqlx::Error> {
        let user_type_str = match user_type {
            UserType::Svc => "Svc",
            UserType::Sts => "Sts",
            UserType::Reg => "Reg",
            UserType::None => "None",
        };

        let entities = sqlx::query_as::<_, UserIdentityEntity>(
            "SELECT id, name, user_type, identity_data, ttl, created_at, updated_at FROM user_identities WHERE user_type = $1"
        )
        .bind(user_type_str)
        .fetch_all(pool)
        .await?;

        for entity in entities {
            let user_identity: nebulafx_policy::auth::UserIdentity = serde_json::from_value(entity.identity_data)
                .map_err(|e| sqlx::Error::Decode(Box::new(e)))?;
            m.insert(entity.name, user_identity);
        }

        Ok(())
    }

    /// Load secret key for a user
    pub async fn load_secret_key(
        pool: &PgPool,
        name: &str,
        user_type: UserType,
    ) -> Result<String, sqlx::Error> {
        if let Some(user_identity) = Self::find(pool, name, user_type).await? {
            Ok(user_identity.credentials.secret_key)
        } else {
            Err(sqlx::Error::RowNotFound)
        }
    }
}

