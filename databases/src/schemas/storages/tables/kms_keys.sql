CREATE TABLE IF NOT EXISTS "storages"."kms_keys" (
  "key_id" VARCHAR(128) PRIMARY KEY,
  "status" VARCHAR(32) NOT NULL DEFAULT 'enabled',
  "description" TEXT NOT NULL DEFAULT '',
  "delete_at" TIMESTAMP,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
