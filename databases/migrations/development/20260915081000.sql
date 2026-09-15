-- pgcrypto.sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- schema.sql
CREATE SCHEMA IF NOT EXISTS "storages";

-- access_keys.sql
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

-- policies.sql
CREATE TABLE IF NOT EXISTS "storages"."policies" (
  "name" VARCHAR(255) PRIMARY KEY,
  "document" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- groups.sql
CREATE TABLE IF NOT EXISTS "storages"."groups" (
  "name" VARCHAR(255) PRIMARY KEY,
  "status" VARCHAR(32) NOT NULL DEFAULT 'enabled',
  "members" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "policy_name" VARCHAR(255),
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- event_targets.sql
CREATE TABLE IF NOT EXISTS "storages"."event_targets" (
  "target_type" VARCHAR(64) NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "config" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("target_type", "name")
);

-- tiers.sql
CREATE TABLE IF NOT EXISTS "storages"."tiers" (
  "name" VARCHAR(255) PRIMARY KEY,
  "config" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- kms_keys.sql
CREATE TABLE IF NOT EXISTS "storages"."kms_keys" (
  "key_id" VARCHAR(128) PRIMARY KEY,
  "status" VARCHAR(32) NOT NULL DEFAULT 'enabled',
  "description" TEXT NOT NULL DEFAULT '',
  "delete_at" TIMESTAMP,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- kms_state.sql
CREATE TABLE IF NOT EXISTS "storages"."kms_state" (
  "id" VARCHAR(32) PRIMARY KEY,
  "status" VARCHAR(32) NOT NULL DEFAULT 'stopped',
  "config" JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- remote_targets.sql
CREATE TABLE IF NOT EXISTS "storages"."remote_targets" (
  "bucket" VARCHAR(255) NOT NULL,
  "arn" VARCHAR(512) NOT NULL,
  "config" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("bucket", "arn")
);

-- access_keys_active_view.sql
CREATE OR REPLACE VIEW "storages"."AccessKeysActiveView" AS
SELECT
  "access_key", "secret_key", "status", "name", "description",
  "parent_key", "account_id", "profile_id", "policy_name",
  "session_token", "expires_at", "created_at", "updated_at"
FROM "storages"."access_keys";

COMMENT ON VIEW "storages"."AccessKeysActiveView" IS 'IAM access key rows.';

-- policies_active_view.sql
CREATE OR REPLACE VIEW "storages"."PoliciesActiveView" AS
SELECT "name", "document", "created_at"
FROM "storages"."policies";

COMMENT ON VIEW "storages"."PoliciesActiveView" IS 'IAM policy documents.';

-- groups_active_view.sql
CREATE OR REPLACE VIEW "storages"."GroupsActiveView" AS
SELECT "name", "status", "members", "policy_name", "created_at"
FROM "storages"."groups";

COMMENT ON VIEW "storages"."GroupsActiveView" IS 'IAM group rows.';

-- event_targets_active_view.sql
CREATE OR REPLACE VIEW "storages"."EventTargetsActiveView" AS
SELECT "target_type", "name", "config", "created_at"
FROM "storages"."event_targets";

COMMENT ON VIEW "storages"."EventTargetsActiveView" IS 'Event notification targets.';

-- tiers_active_view.sql
CREATE OR REPLACE VIEW "storages"."TiersActiveView" AS
SELECT "name", "config", "created_at"
FROM "storages"."tiers";

COMMENT ON VIEW "storages"."TiersActiveView" IS 'Storage tier rows.';

-- kms_keys_active_view.sql
CREATE OR REPLACE VIEW "storages"."KmsKeysActiveView" AS
SELECT "key_id", "status", "description", "delete_at", "created_at"
FROM "storages"."kms_keys";

COMMENT ON VIEW "storages"."KmsKeysActiveView" IS 'KMS key rows.';

-- kms_state_active_view.sql
CREATE OR REPLACE VIEW "storages"."KmsStateActiveView" AS
SELECT "id", "status", "config"
FROM "storages"."kms_state";

COMMENT ON VIEW "storages"."KmsStateActiveView" IS 'KMS service state.';

-- remote_targets_active_view.sql
CREATE OR REPLACE VIEW "storages"."RemoteTargetsActiveView" AS
SELECT "bucket", "arn", "config", "created_at"
FROM "storages"."remote_targets";

COMMENT ON VIEW "storages"."RemoteTargetsActiveView" IS 'Remote replication targets.';

-- schema.sql
CREATE SCHEMA IF NOT EXISTS "system";

-- system_state.sql
CREATE TABLE IF NOT EXISTS "system"."system_state" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "initialized" BOOLEAN NOT NULL DEFAULT false,
  "initialized_at" TIMESTAMP,
  "initialization_version" VARCHAR(50),
  "reset_count" INTEGER NOT NULL DEFAULT 0,
  "metadata" JSONB DEFAULT '{}'::jsonb,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "idx_system_state_created_at" ON "system"."system_state"("created_at" DESC);

-- system_state_active_view.sql
CREATE OR REPLACE VIEW "system"."SystemStateActiveView" AS
SELECT
  "id", "initialized", "initialized_at", "initialization_version",
  "reset_count", "metadata", "created_at", "updated_at"
FROM "system"."system_state";

COMMENT ON VIEW "system"."SystemStateActiveView" IS 'System bootstrap state rows.';
