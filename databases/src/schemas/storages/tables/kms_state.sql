CREATE TABLE IF NOT EXISTS "storages"."kms_state" (
  "id" VARCHAR(32) PRIMARY KEY,
  "status" VARCHAR(32) NOT NULL DEFAULT 'stopped',
  "config" JSONB NOT NULL DEFAULT '{}'::jsonb
);
