CREATE OR REPLACE VIEW "storages"."RemoteTargetsActiveView" AS
SELECT "bucket", "arn", "config", "created_at"
FROM "storages"."remote_targets";

COMMENT ON VIEW "storages"."RemoteTargetsActiveView" IS 'Remote replication targets.';
