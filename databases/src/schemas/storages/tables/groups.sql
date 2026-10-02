CREATE TABLE IF NOT EXISTS "storages"."groups" (
  "name" VARCHAR(255) PRIMARY KEY,
  "status" VARCHAR(32) NOT NULL DEFAULT 'enabled',
  "members" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "policy_name" VARCHAR(255),
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
