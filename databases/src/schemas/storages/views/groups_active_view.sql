CREATE OR REPLACE VIEW "storages"."GroupsActiveView" AS
SELECT "name", "status", "members", "policy_name", "created_at"
FROM "storages"."groups";

COMMENT ON VIEW "storages"."GroupsActiveView" IS 'IAM group rows.';
