use crate::{
    admin::{auth::validate_admin_request, router::Operation},
    auth::{check_key_valid, get_session_token},
};
use http::{HeaderMap, StatusCode};
use matchit::Params;

use nebulafx_ecstore::{
    bucket::{
        metadata::{
            BUCKET_LIFECYCLE_CONFIG, BUCKET_NOTIFICATION_CONFIG, BUCKET_POLICY_CONFIG, BUCKET_QUOTA_CONFIG_FILE,
            BUCKET_REPLICATION_CONFIG, BUCKET_SSECONFIG, BUCKET_TAGGING_CONFIG, BUCKET_TARGETS_FILE, BUCKET_VERSIONING_CONFIG,
            OBJECT_LOCK_CONFIG,
        },
    },
    new_object_layer_fn,
    store_api::BucketOptions,
    StorageAPI,
};
use nebulafx_policy::policy::action::{Action, AdminAction};
use nebulafx_utils::path::path_join_buf;
use s3s::{
    Body, S3Error, S3ErrorCode, S3Request, S3Response, S3Result,
    header::{CONTENT_DISPOSITION, CONTENT_LENGTH, CONTENT_TYPE},
    s3_error,
};
use serde_urlencoded::from_bytes;
use std::io::Cursor;
use zip::ZipWriter;

use super::export_match;

#[derive(Debug, Default, serde::Deserialize)]
pub struct ExportBucketMetadataQuery {
    pub bucket: String,
}

pub struct ExportBucketMetadata {}

#[async_trait::async_trait]
impl Operation for ExportBucketMetadata {
    async fn call(&self, req: S3Request<Body>, _params: Params<'_, '_>) -> S3Result<S3Response<(StatusCode, Body)>> {
        let query = {
            if let Some(query) = req.uri.query() {
                let input: ExportBucketMetadataQuery =
                    from_bytes(query.as_bytes()).map_err(|_e| S3Error::with_message(S3ErrorCode::InvalidArgument, super::error::messages::GET_QUERY_FAILED))?;
                input
            } else {
                ExportBucketMetadataQuery::default()
            }
        };

        let Some(input_cred) = req.credentials else {
            return Err(S3Error::with_message(S3ErrorCode::InvalidRequest, super::error::messages::GET_CRED_FAILED));
        };

        let (cred, owner) =
            check_key_valid(get_session_token(&req.uri, &req.headers).unwrap_or_default(), &input_cred.access_key).await?;

        validate_admin_request(
            &req.headers,
            &cred,
            owner,
            false,
            vec![Action::AdminAction(AdminAction::ExportBucketMetadataAction)],
        )
        .await?;

        let Some(store) = new_object_layer_fn() else {
            return Err(S3Error::with_message(S3ErrorCode::InvalidRequest, super::error::messages::OBJECT_STORE_NOT_INIT));
        };

        let buckets = if query.bucket.is_empty() {
            store
                .list_bucket(&BucketOptions::default())
                .await
                .map_err(|e| s3_error!(InternalError, "{}: {e}", super::error::messages::LIST_BUCKETS_FAILED))?
        } else {
            let bucket = store
                .get_bucket_info(&query.bucket, &BucketOptions::default())
                .await
                .map_err(|e| s3_error!(InternalError, "{}: {e}", super::error::messages::GET_BUCKET_FAILED))?;
            vec![bucket]
        };

        let mut zip_writer = ZipWriter::new(Cursor::new(Vec::new()));

        let confs = [
            BUCKET_POLICY_CONFIG,
            BUCKET_NOTIFICATION_CONFIG,
            BUCKET_LIFECYCLE_CONFIG,
            BUCKET_SSECONFIG,
            BUCKET_TAGGING_CONFIG,
            BUCKET_QUOTA_CONFIG_FILE,
            OBJECT_LOCK_CONFIG,
            BUCKET_VERSIONING_CONFIG,
            BUCKET_REPLICATION_CONFIG,
            BUCKET_TARGETS_FILE,
        ];

        for bucket in buckets {
            for &conf in confs.iter() {
                let conf_path = path_join_buf(&[bucket.name.as_str(), conf]);
                let result = match conf {
                    BUCKET_POLICY_CONFIG => export_match::export_policy_config(&bucket.name, &mut zip_writer, &conf_path).await,
                    BUCKET_NOTIFICATION_CONFIG => export_match::export_notification_config(&bucket.name, &mut zip_writer, &conf_path).await,
                    BUCKET_LIFECYCLE_CONFIG => export_match::export_lifecycle_config(&bucket.name, &mut zip_writer, &conf_path).await,
                    BUCKET_TAGGING_CONFIG => export_match::export_tagging_config(&bucket.name, &mut zip_writer, &conf_path).await,
                    BUCKET_QUOTA_CONFIG_FILE => export_match::export_quota_config(&bucket.name, &mut zip_writer, &conf_path).await,
                    OBJECT_LOCK_CONFIG => export_match::export_object_lock_config(&bucket.name, &mut zip_writer, &conf_path).await,
                    BUCKET_SSECONFIG => export_match::export_sse_config(&bucket.name, &mut zip_writer, &conf_path).await,
                    BUCKET_VERSIONING_CONFIG => export_match::export_versioning_config(&bucket.name, &mut zip_writer, &conf_path).await,
                    BUCKET_REPLICATION_CONFIG => export_match::export_replication_config(&bucket.name, &mut zip_writer, &conf_path).await,
                    BUCKET_TARGETS_FILE => export_match::export_targets_config(&bucket.name, &mut zip_writer, &conf_path).await,
                    _ => Ok(()),
                };

                match result {
                    Ok(()) => {}
                    Err(e) if *e.code() == S3ErrorCode::InvalidRequest && e.message().map_or(false, |m| m.contains("ConfigNotFound")) => {
                        continue;
                    }
                    Err(e) => return Err(e),
                }
            }
        }

        let zip_bytes = zip_writer
            .finish()
            .map_err(|e| s3_error!(InternalError, "{}: {e}", super::error::messages::FINISH_ZIP_FAILED))?;
        let mut header = HeaderMap::new();
        header.insert(CONTENT_TYPE, "application/zip".parse().unwrap());
        header.insert(CONTENT_DISPOSITION, "attachment; filename=bucket-meta.zip".parse().unwrap());
        header.insert(CONTENT_LENGTH, zip_bytes.get_ref().len().to_string().parse().unwrap());
        Ok(S3Response::with_headers((StatusCode::OK, Body::from(zip_bytes.into_inner())), header))
    }
}

