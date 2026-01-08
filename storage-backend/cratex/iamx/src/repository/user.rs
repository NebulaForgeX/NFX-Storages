use crate::entity::UserEntity;
use sqlx::PgPool;

/// Repository for user database operations
pub struct UserRepository;

impl UserRepository {
    /// Check if a user exists by ID
    pub async fn exists_by_id(pool: &PgPool, id: i64) -> Result<bool, sqlx::Error> {
        let exists: bool = sqlx::query_scalar(
            "SELECT EXISTS(SELECT 1 FROM users WHERE id = $1)"
        )
        .bind(id)
        .fetch_one(pool)
        .await?;
        
        Ok(exists)
    }
    
    /// Check if a user exists by access key
    pub async fn exists_by_access_key(pool: &PgPool, access_key: &str) -> Result<bool, sqlx::Error> {
        let exists: bool = sqlx::query_scalar(
            "SELECT EXISTS(SELECT 1 FROM users WHERE access_key = $1)"
        )
        .bind(access_key)
        .fetch_one(pool)
        .await?;
        
        Ok(exists)
    }
    
    /// Find user by ID
    pub async fn find_by_id(
        pool: &PgPool,
        id: i64,
    ) -> Result<Option<UserEntity>, sqlx::Error> {
        sqlx::query_as::<_, UserEntity>(
            "SELECT id, access_key, secret_key, user_type, created_at, updated_at FROM users WHERE id = $1"
        )
        .bind(id)
        .fetch_optional(pool)
        .await
    }
    
    /// Find user by access key
    pub async fn find_by_access_key(
        pool: &PgPool,
        access_key: &str,
    ) -> Result<Option<UserEntity>, sqlx::Error> {
        sqlx::query_as::<_, UserEntity>(
            "SELECT id, access_key, secret_key, user_type, created_at, updated_at FROM users WHERE access_key = $1"
        )
        .bind(access_key)
        .fetch_optional(pool)
        .await
    }
    
    /// Create a new user
    /// Returns the created user entity
    pub async fn create(
        pool: &PgPool,
        access_key: &str,
        secret_key: &str,
        user_type: &str,
    ) -> Result<UserEntity, sqlx::Error> {
        sqlx::query_as::<_, UserEntity>(
            "INSERT INTO users (access_key, secret_key, user_type) VALUES ($1, $2, $3) RETURNING id, access_key, secret_key, user_type, created_at, updated_at"
        )
        .bind(access_key)
        .bind(secret_key)
        .bind(user_type)
        .fetch_one(pool)
        .await
    }
    
    /// Create or update root user (ID = 1)
    /// Uses ON CONFLICT to update if user already exists
    pub async fn create_root_user(
        pool: &PgPool,
        access_key: &str,
        secret_key: &str,
    ) -> Result<UserEntity, sqlx::Error> {
        sqlx::query_as::<_, UserEntity>(
            r#"
            INSERT INTO users (id, access_key, secret_key, user_type)
            VALUES (1, $1, $2, 'root')
            ON CONFLICT (id) DO UPDATE SET
                access_key = EXCLUDED.access_key,
                secret_key = EXCLUDED.secret_key,
                updated_at = NOW()
            RETURNING id, access_key, secret_key, user_type, created_at, updated_at
            "#
        )
        .bind(access_key)
        .bind(secret_key)
        .fetch_one(pool)
        .await
    }
    
    /// Update user by ID
    /// Updates access_key, secret_key, and user_type
    /// All parameters are optional - only provided fields will be updated
    pub async fn update(
        pool: &PgPool,
        id: i64,
        access_key: Option<&str>,
        secret_key: Option<&str>,
        user_type: Option<&str>,
    ) -> Result<Option<UserEntity>, sqlx::Error> {
        // Build dynamic update query
        let mut set_clauses = Vec::new();
        let mut param_index = 1;
        
        if access_key.is_some() {
            set_clauses.push(format!("access_key = ${}", param_index));
            param_index += 1;
        }
        if secret_key.is_some() {
            set_clauses.push(format!("secret_key = ${}", param_index));
            param_index += 1;
        }
        if user_type.is_some() {
            set_clauses.push(format!("user_type = ${}", param_index));
            param_index += 1;
        }
        
        // Always update updated_at
        set_clauses.push(format!("updated_at = NOW()"));
        
        if set_clauses.is_empty() {
            // No fields to update, just return the current user
            return Self::find_by_id(pool, id).await;
        }
        
        let set_clause = set_clauses.join(", ");
        let query = format!(
            "UPDATE users SET {} WHERE id = ${} RETURNING id, access_key, secret_key, user_type, created_at, updated_at",
            set_clause, param_index
        );
        
        // Use query_as for dynamic queries
        let mut query_builder = sqlx::query_as::<_, UserEntity>(&query);
        
        // Bind parameters in order
        if let Some(ak) = access_key {
            query_builder = query_builder.bind(ak);
        }
        if let Some(sk) = secret_key {
            query_builder = query_builder.bind(sk);
        }
        if let Some(ut) = user_type {
            query_builder = query_builder.bind(ut);
        }
        query_builder = query_builder.bind(id);
        
        query_builder.fetch_optional(pool).await
    }
    
    /// Hard delete user by ID
    /// Permanently removes the user from the database
    pub async fn delete(pool: &PgPool, id: i64) -> Result<bool, sqlx::Error> {
        let rows_affected = sqlx::query("DELETE FROM users WHERE id = $1")
            .bind(id)
            .execute(pool)
            .await?
            .rows_affected();
        
        Ok(rows_affected > 0)
    }
    
    /// Hard delete user by access key
    /// Permanently removes the user from the database
    pub async fn delete_by_access_key(pool: &PgPool, access_key: &str) -> Result<bool, sqlx::Error> {
        let rows_affected = sqlx::query("DELETE FROM users WHERE access_key = $1")
            .bind(access_key)
            .execute(pool)
            .await?
            .rows_affected();
        
        Ok(rows_affected > 0)
    }
    
    /// List all users with pagination
    pub async fn list(
        pool: &PgPool,
        limit: i64,
        offset: i64,
    ) -> Result<Vec<UserEntity>, sqlx::Error> {
        sqlx::query_as::<_, UserEntity>(
            "SELECT id, access_key, secret_key, user_type, created_at, updated_at FROM users ORDER BY id LIMIT $1 OFFSET $2"
        )
        .bind(limit)
        .bind(offset)
        .fetch_all(pool)
        .await
    }
    
    /// Count total number of users
    pub async fn count(pool: &PgPool) -> Result<i64, sqlx::Error> {
        let count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM users")
            .fetch_one(pool)
            .await?;
        
        Ok(count)
    }
}

