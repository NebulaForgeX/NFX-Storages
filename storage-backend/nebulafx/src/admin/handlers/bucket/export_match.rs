use nebulafx_ecstore::{
    bucket::{
        quota::BucketQuota,
        target::BucketTargets,
        metadata_sys,
    },
    error::StorageError,
};
use nebulafx_ecstore::bucket::utils::serialize;
use nebulafx_policy::policy::BucketPolicy;
use s3s::{
    S3Error, S3ErrorCode, S3Result,
    s3_error,
    xml::Serialize as XmlSerialize,
};
use std::io::{Cursor, Write as _};
use zip::{ZipWriter, write::SimpleFileOptions};

/// Helper function to write JSON config to zip
fn write_json_config<T: serde::Serialize>(
    zip_writer: &mut ZipWriter<Cursor<Vec<u8>>>,
    conf_path: &str,
    config: &T,
) -> S3Result<()> {
    let config_json = serde_json::to_vec(config)
        .map_err(|e| s3_error!(InternalError, "{}: {e}", super::error::messages::SERIALIZE_CONFIG_FAILED))?;
    zip_writer
        .start_file(conf_path, SimpleFileOptions::default())
        .map_err(|e| s3_error!(InternalError, "{}: {e}", super::error::messages::START_FILE_FAILED))?;
    zip_writer
        .write_all(&config_json)
        .map_err(|e| s3_error!(InternalError, "{}: {e}", super::error::messages::WRITE_FILE_FAILED))?;
    Ok(())
}

/// Helper function to write XML config to zip
fn write_xml_config<T: XmlSerialize>(
    zip_writer: &mut ZipWriter<Cursor<Vec<u8>>>,
    conf_path: &str,
    config: &T,
) -> S3Result<()> {
    let config_xml = serialize(config)
        .map_err(|e| s3_error!(InternalError, "{}: {e}", super::error::messages::SERIALIZE_CONFIG_FAILED))?;
    zip_writer
        .start_file(conf_path, SimpleFileOptions::default())
        .map_err(|e| s3_error!(InternalError, "{}: {e}", super::error::messages::START_FILE_FAILED))?;
    zip_writer
        .write_all(&config_xml)
        .map_err(|e| s3_error!(InternalError, "{}: {e}", super::error::messages::WRITE_FILE_FAILED))?;
    Ok(())
}

/// Handle ConfigNotFound error - returns a special error that can be checked
fn handle_config_error(e: StorageError) -> S3Result<()> {
    if e == StorageError::ConfigNotFound {
        Err(S3Error::with_message(S3ErrorCode::InvalidRequest, "ConfigNotFound"))
    } else {
        Err(s3_error!(InternalError, "{}: {e}", super::error::messages::GET_BUCKET_METADATA_FAILED))
    }
}

/// Export bucket policy config
pub(super) async fn export_policy_config(
    bucket_name: &str,
    zip_writer: &mut ZipWriter<Cursor<Vec<u8>>>,
    conf_path: &str,
) -> S3Result<()> {
    let config: BucketPolicy = match metadata_sys::get_bucket_policy(bucket_name).await {
        Ok((res, _)) => res,
        Err(e) => return handle_config_error(e),
    };
    write_json_config(zip_writer, conf_path, &config)
}

/// Export notification config
pub(super) async fn export_notification_config(
    bucket_name: &str,
    zip_writer: &mut ZipWriter<Cursor<Vec<u8>>>,
    conf_path: &str,
) -> S3Result<()> {
    let config: s3s::dto::NotificationConfiguration = match metadata_sys::get_notification_config(bucket_name).await {
        Ok(Some(res)) => res,
        Err(e) => return handle_config_error(e),
        Ok(None) => return Err(S3Error::with_message(S3ErrorCode::InvalidRequest, "ConfigNotFound")),
    };
    write_xml_config(zip_writer, conf_path, &config)
}

/// Export lifecycle config
pub(super) async fn export_lifecycle_config(
    bucket_name: &str,
    zip_writer: &mut ZipWriter<Cursor<Vec<u8>>>,
    conf_path: &str,
) -> S3Result<()> {
    let config: s3s::dto::BucketLifecycleConfiguration = match metadata_sys::get_lifecycle_config(bucket_name).await {
        Ok((res, _)) => res,
        Err(e) => return handle_config_error(e),
    };
    write_xml_config(zip_writer, conf_path, &config)
}

/// Export tagging config
pub(super) async fn export_tagging_config(
    bucket_name: &str,
    zip_writer: &mut ZipWriter<Cursor<Vec<u8>>>,
    conf_path: &str,
) -> S3Result<()> {
    let config: s3s::dto::Tagging = match metadata_sys::get_tagging_config(bucket_name).await {
        Ok((res, _)) => res,
        Err(e) => return handle_config_error(e),
    };
    write_xml_config(zip_writer, conf_path, &config)
}

/// Export quota config
pub(super) async fn export_quota_config(
    bucket_name: &str,
    zip_writer: &mut ZipWriter<Cursor<Vec<u8>>>,
    conf_path: &str,
) -> S3Result<()> {
    let config: BucketQuota = match metadata_sys::get_quota_config(bucket_name).await {
        Ok((res, _)) => res,
        Err(e) => return handle_config_error(e),
    };
    write_json_config(zip_writer, conf_path, &config)
}

/// Export object lock config
pub(super) async fn export_object_lock_config(
    bucket_name: &str,
    zip_writer: &mut ZipWriter<Cursor<Vec<u8>>>,
    conf_path: &str,
) -> S3Result<()> {
    let config = match metadata_sys::get_object_lock_config(bucket_name).await {
        Ok((res, _)) => res,
        Err(e) => return handle_config_error(e),
    };
    write_xml_config(zip_writer, conf_path, &config)
}

/// Export SSE config
pub(super) async fn export_sse_config(
    bucket_name: &str,
    zip_writer: &mut ZipWriter<Cursor<Vec<u8>>>,
    conf_path: &str,
) -> S3Result<()> {
    let config = match metadata_sys::get_sse_config(bucket_name).await {
        Ok((res, _)) => res,
        Err(e) => return handle_config_error(e),
    };
    write_xml_config(zip_writer, conf_path, &config)
}

/// Export versioning config
pub(super) async fn export_versioning_config(
    bucket_name: &str,
    zip_writer: &mut ZipWriter<Cursor<Vec<u8>>>,
    conf_path: &str,
) -> S3Result<()> {
    let config = match metadata_sys::get_versioning_config(bucket_name).await {
        Ok((res, _)) => res,
        Err(e) => return handle_config_error(e),
    };
    write_xml_config(zip_writer, conf_path, &config)
}

/// Export replication config
pub(super) async fn export_replication_config(
    bucket_name: &str,
    zip_writer: &mut ZipWriter<Cursor<Vec<u8>>>,
    conf_path: &str,
) -> S3Result<()> {
    let config = match metadata_sys::get_replication_config(bucket_name).await {
        Ok((res, _)) => res,
        Err(e) => return handle_config_error(e),
    };
    write_xml_config(zip_writer, conf_path, &config)
}

/// Export targets config
pub(super) async fn export_targets_config(
    bucket_name: &str,
    zip_writer: &mut ZipWriter<Cursor<Vec<u8>>>,
    conf_path: &str,
) -> S3Result<()> {
    let config: BucketTargets = match metadata_sys::get_bucket_targets_config(bucket_name).await {
        Ok(res) => res,
        Err(e) => return handle_config_error(e),
    };
    write_json_config(zip_writer, conf_path, &config)
}

