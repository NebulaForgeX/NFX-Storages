CREATE OR REPLACE VIEW "system"."SystemStateActiveView" AS
SELECT
  "id", "initialized", "initialized_at", "initialization_version",
  "reset_count", "metadata", "created_at", "updated_at"
FROM "system"."system_state";

COMMENT ON VIEW "system"."SystemStateActiveView" IS 'System bootstrap state rows.';
