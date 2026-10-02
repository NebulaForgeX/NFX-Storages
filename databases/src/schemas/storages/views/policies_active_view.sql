CREATE OR REPLACE VIEW "storages"."PoliciesActiveView" AS
SELECT "name", "document", "created_at"
FROM "storages"."policies";

COMMENT ON VIEW "storages"."PoliciesActiveView" IS 'IAM policy documents.';
