CREATE OR REPLACE VIEW "storages"."TiersActiveView" AS
SELECT "name", "config", "created_at"
FROM "storages"."tiers";

COMMENT ON VIEW "storages"."TiersActiveView" IS 'Storage tier rows.';
