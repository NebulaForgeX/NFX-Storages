CREATE OR REPLACE VIEW "storages"."AccessKeysActiveView" AS
SELECT
  "access_key", "secret_key", "status", "name", "description",
  "parent_key", "account_id", "profile_id", "policy_name",
  "session_token", "expires_at", "created_at", "updated_at"
FROM "storages"."access_keys";

COMMENT ON VIEW "storages"."AccessKeysActiveView" IS 'IAM access key rows.';
