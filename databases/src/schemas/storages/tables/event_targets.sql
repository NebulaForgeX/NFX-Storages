CREATE TABLE IF NOT EXISTS "storages"."event_targets" (
  "target_type" VARCHAR(64) NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "config" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("target_type", "name")
);
