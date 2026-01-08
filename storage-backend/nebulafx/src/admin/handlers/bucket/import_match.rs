use nebulafx_ecstore::bucket::{
    metadata::BucketMetadata,
    quota::BucketQuota,
    target::BucketTargets,
};
use nebulafx_ecstore::bucket::utils::deserialize;
use nebulafx_policy::policy::BucketPolicy;
use s3s::dto::{
    BucketLifecycleConfiguration, ObjectLockConfiguration, ReplicationConfiguration,
    ServerSideEncryptionConfiguration, Tagging, VersioningConfiguration,
};
use time::OffsetDateTime;
use tracing::warn;

use super::error::messages;

/// Import bucket policy config
pub(super) fn import_policy_config(
    content: &[u8],
    metadata: &mut BucketMetadata,
    update_at: OffsetDateTime,
) {
    let config: BucketPolicy = match serde_json::from_slice(content) {
        Ok(config) => config,
        Err(e) => {
            warn!("{}: {e}", messages::DESERIALIZE_CONFIG_FAILED);
            return;
        }
    };

    if config.version.is_empty() {
        return;
    }

    metadata.policy_config_json = content.to_vec();
    metadata.policy_config_updated_at = update_at;
}

/// Import notification config
pub(super) fn import_notification_config(
    content: &[u8],
    metadata: &mut BucketMetadata,
    update_at: OffsetDateTime,
) {
    if let Err(e) = deserialize::<s3s::dto::NotificationConfiguration>(content) {
        warn!("{}: {e}", messages::DESERIALIZE_CONFIG_FAILED);
        return;
    }

    metadata.notification_config_xml = content.to_vec();
    metadata.notification_config_updated_at = update_at;
}

/// Import lifecycle config
pub(super) fn import_lifecycle_config(
    content: &[u8],
    metadata: &mut BucketMetadata,
    update_at: OffsetDateTime,
) {
    if let Err(e) = deserialize::<BucketLifecycleConfiguration>(content) {
        warn!("{}: {e}", messages::DESERIALIZE_CONFIG_FAILED);
        return;
    }

    metadata.lifecycle_config_xml = content.to_vec();
    metadata.lifecycle_config_updated_at = update_at;
}

/// Import SSE config
pub(super) fn import_sse_config(
    content: &[u8],
    metadata: &mut BucketMetadata,
    update_at: OffsetDateTime,
) {
    if let Err(e) = deserialize::<ServerSideEncryptionConfiguration>(content) {
        warn!("{}: {e}", messages::DESERIALIZE_CONFIG_FAILED);
        return;
    }

    metadata.encryption_config_xml = content.to_vec();
    metadata.encryption_config_updated_at = update_at;
}

/// Import tagging config
pub(super) fn import_tagging_config(
    content: &[u8],
    metadata: &mut BucketMetadata,
    update_at: OffsetDateTime,
) {
    if let Err(e) = deserialize::<Tagging>(content) {
        warn!("{}: {e}", messages::DESERIALIZE_CONFIG_FAILED);
        return;
    }

    metadata.tagging_config_xml = content.to_vec();
    metadata.tagging_config_updated_at = update_at;
}

/// Import quota config
pub(super) fn import_quota_config(
    content: &[u8],
    metadata: &mut BucketMetadata,
    update_at: OffsetDateTime,
) {
    if let Err(e) = serde_json::from_slice::<BucketQuota>(content) {
        warn!("{}: {e}", messages::DESERIALIZE_CONFIG_FAILED);
        return;
    }

    metadata.quota_config_json = content.to_vec();
    metadata.quota_config_updated_at = update_at;
}

/// Import object lock config
pub(super) fn import_object_lock_config(
    content: &[u8],
    metadata: &mut BucketMetadata,
    update_at: OffsetDateTime,
) {
    if let Err(e) = deserialize::<ObjectLockConfiguration>(content) {
        warn!("{}: {e}", messages::DESERIALIZE_CONFIG_FAILED);
        return;
    }

    metadata.object_lock_config_xml = content.to_vec();
    metadata.object_lock_config_updated_at = update_at;
}

/// Import versioning config
pub(super) fn import_versioning_config(
    content: &[u8],
    metadata: &mut BucketMetadata,
    update_at: OffsetDateTime,
) {
    if let Err(e) = deserialize::<VersioningConfiguration>(content) {
        warn!("{}: {e}", messages::DESERIALIZE_CONFIG_FAILED);
        return;
    }

    metadata.versioning_config_xml = content.to_vec();
    metadata.versioning_config_updated_at = update_at;
}

/// Import replication config
pub(super) fn import_replication_config(
    content: &[u8],
    metadata: &mut BucketMetadata,
    update_at: OffsetDateTime,
) {
    if let Err(e) = deserialize::<ReplicationConfiguration>(content) {
        warn!("{}: {e}", messages::DESERIALIZE_CONFIG_FAILED);
        return;
    }

    metadata.replication_config_xml = content.to_vec();
    metadata.replication_config_updated_at = update_at;
}

/// Import targets config
pub(super) fn import_targets_config(
    content: &[u8],
    metadata: &mut BucketMetadata,
    update_at: OffsetDateTime,
) {
    if let Err(e) = serde_json::from_slice::<BucketTargets>(content) {
        warn!("{}: {e}", messages::DESERIALIZE_CONFIG_FAILED);
        return;
    }

    metadata.bucket_targets_config_json = content.to_vec();
    metadata.bucket_targets_config_updated_at = update_at;
}

