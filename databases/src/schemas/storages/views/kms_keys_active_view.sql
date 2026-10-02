CREATE OR REPLACE VIEW "storages"."KmsKeysActiveView" AS
SELECT "key_id", "status", "description", "delete_at", "created_at"
FROM "storages"."kms_keys";

COMMENT ON VIEW "storages"."KmsKeysActiveView" IS 'KMS key rows.';
