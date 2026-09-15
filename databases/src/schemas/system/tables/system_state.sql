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
