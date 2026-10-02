CREATE TABLE IF NOT EXISTS "storages"."access_keys" (
  "access_key" VARCHAR(64) PRIMARY KEY,
  "secret_key" VARCHAR(128) NOT NULL,
  "status" VARCHAR(32) NOT NULL DEFAULT 'enabled',
  "name" VARCHAR(255) NOT NULL DEFAULT '',
  "description" TEXT NOT NULL DEFAULT '',
  "parent_key" VARCHAR(64),
  "account_id" UUID,
  "profile_id" UUID,
  "policy_name" VARCHAR(255),
  "session_token" VARCHAR(128),
  "expires_at" TIMESTAMP,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_access_keys_account ON "storages"."access_keys"("account_id", "profile_id");
CREATE INDEX IF NOT EXISTS idx_access_keys_parent ON "storages"."access_keys"("parent_key");
