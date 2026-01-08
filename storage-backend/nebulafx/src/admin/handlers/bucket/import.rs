use crate::admin::{auth::validate_admin_request, router::Operation};
use crate::auth::{check_key_valid, get_session_token};
use http::{HeaderMap, StatusCode};
use matchit::Params;
use nebulafx_ecstore::{
    bucket::{
        metadata::{
            BUCKET_LIFECYCLE_CONFIG, 
            BUCKET_NOTIFICATION_CONFIG, 
            BUCKET_POLICY_CONFIG, 
            BUCKET_QUOTA_CONFIG_FILE,
            BUCKET_REPLICATION_CONFIG, 
            BUCKET_SSECONFIG, 
            BUCKET_TAGGING_CONFIG, 
            BUCKET_TARGETS_FILE, 
            BUCKET_VERSIONING_CONFIG,
            BucketMetadata, 
            OBJECT_LOCK_CONFIG,
        },
        metadata_sys,
    },
    error::StorageError,
    new_object_layer_fn,
    store_api::MakeBucketOptions,
    StorageAPI,
};
use nebulafx_policy::policy::action::{Action, AdminAction};
use nebulafx_utils::path::SLASH_SEPARATOR;
use s3s::{Body, S3Error, S3ErrorCode, S3Request, S3Response, S3Result};
use s3s::header::{CONTENT_LENGTH, CONTENT_TYPE};
use s3s::s3_error;
use serde::Deserialize;
use serde_urlencoded::from_bytes;
use std::collections::HashMap;
use std::io::{Cursor, Read as _};
use time::OffsetDateTime;
use tracing::warn;
use zip::ZipArchive;

use super::import_match;

#[derive(Debug, Default, Deserialize)]
pub struct ImportBucketMetadataQuery {
    #[allow(dead_code)]
    pub bucket: String,
}

pub struct ImportBucketMetadata {}

#[async_trait::async_trait]
impl Operation for ImportBucketMetadata {
    async fn call(&self, req: S3Request<Body>, _params: Params<'_, '_>) -> S3Result<S3Response<(StatusCode, Body)>> {
        let _query = {
            if let Some(query) = req.uri.query() {
                let input: ImportBucketMetadataQuery =
                    from_bytes(query.as_bytes()).map_err(|_e| S3Error::with_message(S3ErrorCode::InvalidArgument, super::error::messages::GET_QUERY_FAILED))?;
                input
            } else {
                ImportBucketMetadataQuery::default()
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
            vec![Action::AdminAction(AdminAction::ImportBucketMetadataAction)],
        )
        .await?;

        let mut input = req.input;
        let body = match input.store_all_unlimited().await {
            Ok(b) => b,
            Err(e) => {
                warn!("get body failed, e: {:?}", e);
                return Err(S3Error::with_message(S3ErrorCode::InvalidRequest, super::error::messages::GET_BODY_FAILED));
            }
        };

        let mut zip_reader = ZipArchive::new(Cursor::new(body))
            .map_err(|e| s3_error!(InternalError, "{}: {e}", super::error::messages::GET_BODY_FAILED))?;

        // First pass: read all file contents into memory
        let mut file_contents = Vec::new();
        for i in 0..zip_reader.len() {
            let mut file = zip_reader
                .by_index(i)
                .map_err(|e| s3_error!(InternalError, "{}: {e}", super::error::messages::GET_FILE_FAILED))?;
            let file_path = file.name().to_string();

            let mut content = Vec::new();
            file.read_to_end(&mut content)
                .map_err(|e| s3_error!(InternalError, "{}: {e}", super::error::messages::READ_FILE_FAILED))?;

            file_contents.push((file_path, content));
        }

        // Extract bucket names
        let mut bucket_names = Vec::new();
        for (file_path, _) in &file_contents {
            let file_path_split = file_path.split(SLASH_SEPARATOR).collect::<Vec<&str>>();

            if file_path_split.len() < 2 {
                warn!("file path is invalid: {}", file_path);
                continue;
            }

            let bucket_name = file_path_split[0].to_string();
            if !bucket_names.contains(&bucket_name) {
                bucket_names.push(bucket_name);
            }
        }

        // Get existing bucket metadata
        let mut bucket_metadatas: HashMap<String, BucketMetadata> = HashMap::new();
        for bucket_name in bucket_names {
            match metadata_sys::get_config_from_disk(&bucket_name).await {
                Ok(res) => {
                    bucket_metadatas.insert(bucket_name, res);
                }
                Err(e) => {
                    if e == StorageError::ConfigNotFound {
                        warn!("bucket metadata not found: {e}");
                        continue;
                    }
                    warn!("get bucket metadata failed: {e}");
                    continue;
                }
            };
        }

        let Some(store) = new_object_layer_fn() else {
            return Err(S3Error::with_message(S3ErrorCode::InvalidRequest, super::error::messages::OBJECT_STORE_NOT_INIT));
        };

        let update_at = OffsetDateTime::now_utc();

        // Second pass: process file contents
        for (file_path, content) in file_contents {
            let file_path_split = file_path.split(SLASH_SEPARATOR).collect::<Vec<&str>>();

            if file_path_split.len() < 2 {
                warn!("file path is invalid: {}", file_path);
                continue;
            }

            let bucket_name = file_path_split[0];
            let conf_name = file_path_split[1];

            // create bucket if not exists
            if !bucket_metadatas.contains_key(bucket_name) {
                if let Err(e) = store
                    .make_bucket(
                        bucket_name,
                        &MakeBucketOptions {
                            force_create: true,
                            ..Default::default()
                        },
                    )
                    .await
                {
                    warn!("{}: {e}", super::error::messages::CREATE_BUCKET_FAILED);
                    continue;
                }

                let metadata = metadata_sys::get(bucket_name).await.unwrap_or_default();

                bucket_metadatas.insert(bucket_name.to_string(), (*metadata).clone());
            }

            let metadata = match bucket_metadatas.get_mut(bucket_name) {
                Some(m) => m,
                None => continue,
            };

            match conf_name {
                BUCKET_POLICY_CONFIG => import_match::import_policy_config(&content, metadata, update_at),
                BUCKET_NOTIFICATION_CONFIG => import_match::import_notification_config(&content, metadata, update_at),
                BUCKET_LIFECYCLE_CONFIG => import_match::import_lifecycle_config(&content, metadata, update_at),
                BUCKET_SSECONFIG => import_match::import_sse_config(&content, metadata, update_at),
                BUCKET_TAGGING_CONFIG => import_match::import_tagging_config(&content, metadata, update_at),
                BUCKET_QUOTA_CONFIG_FILE => import_match::import_quota_config(&content, metadata, update_at),
                OBJECT_LOCK_CONFIG => import_match::import_object_lock_config(&content, metadata, update_at),
                BUCKET_VERSIONING_CONFIG => import_match::import_versioning_config(&content, metadata, update_at),
                BUCKET_REPLICATION_CONFIG => import_match::import_replication_config(&content, metadata, update_at),
                BUCKET_TARGETS_FILE => import_match::import_targets_config(&content, metadata, update_at),
                _ => continue,
            }
        }

        // TODO: site replication notify

        let mut header = HeaderMap::new();
        header.insert(CONTENT_TYPE, "application/json".parse().unwrap());
        header.insert(CONTENT_LENGTH, "0".parse().unwrap());
        Ok(S3Response::with_headers((StatusCode::OK, Body::empty()), header))
    }
}

