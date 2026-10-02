CREATE OR REPLACE VIEW "storages"."EventTargetsActiveView" AS
SELECT "target_type", "name", "config", "created_at"
FROM "storages"."event_targets";

COMMENT ON VIEW "storages"."EventTargetsActiveView" IS 'Event notification targets.';
