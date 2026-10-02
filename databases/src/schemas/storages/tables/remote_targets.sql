CREATE TABLE IF NOT EXISTS "storages"."remote_targets" (
  "bucket" VARCHAR(255) NOT NULL,
  "arn" VARCHAR(512) NOT NULL,
  "config" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("bucket", "arn")
);
