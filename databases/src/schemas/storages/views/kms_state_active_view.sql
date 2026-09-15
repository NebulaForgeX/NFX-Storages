CREATE OR REPLACE VIEW "storages"."KmsStateActiveView" AS
SELECT "id", "status", "config"
FROM "storages"."kms_state";

COMMENT ON VIEW "storages"."KmsStateActiveView" IS 'KMS service state.';
