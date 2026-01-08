use http::{HeaderMap, HeaderValue};
use nebulafx_ecstore::bucket::versioning_sys::BucketVersioningSys;
use nebulafx_ecstore::error::Result;
use nebulafx_ecstore::error::StorageError;
use nebulafx_utils::http::AMZ_META_UNENCRYPTED_CONTENT_LENGTH;
use nebulafx_utils::http::AMZ_META_UNENCRYPTED_CONTENT_MD5;
use s3s::header::X_AMZ_OBJECT_LOCK_MODE;
use s3s::header::X_AMZ_OBJECT_LOCK_RETAIN_UNTIL_DATE;

use crate::auth::UNSIGNED_PAYLOAD;
use crate::auth::UNSIGNED_PAYLOAD_TRAILER;
use nebulafx_ecstore::store_api::{HTTPPreconditions, HTTPRangeSpec, ObjectOptions};
use nebulafx_policy::service_type::ServiceType;
use nebulafx_utils::hash::EMPTY_STRING_SHA256_HASH;
use nebulafx_utils::http::AMZ_CONTENT_SHA256;
use nebulafx_utils::http::RESERVED_METADATA_PREFIX_LOWER;
use nebulafx_utils::http::NEUBULAFX_BUCKET_REPLICATION_DELETE_MARKER;
use nebulafx_utils::http::NEUBULAFX_BUCKET_REPLICATION_REQUEST;
use nebulafx_utils::http::NEUBULAFX_BUCKET_REPLICATION_SSEC_CHECKSUM;
use nebulafx_utils::http::NEUBULAFX_BUCKET_SOURCE_VERSION_ID;
use nebulafx_utils::path::is_dir_object;
use s3s::{S3Result, s3_error};
use std::collections::HashMap;
use std::sync::LazyLock;
use tracing::error;
use uuid::Uuid;

use crate::auth::AuthType;
use crate::auth::get_request_auth_type;
use crate::auth::is_request_presigned_signature_v4;

/// Creates options for deleting an object in a bucket.
pub async fn del_opts(
    bucket: &str,
    object: &str,
    vid: Option<String>,
    headers: &HeaderMap<HeaderValue>,
    metadata: HashMap<String, String>,
) -> Result<ObjectOptions> {
    let versioned = BucketVersioningSys::prefix_enabled(bucket, object).await;
    let version_suspended = BucketVersioningSys::suspended(bucket).await;

    let vid = if vid.is_none() {
        headers
            .get(NEUBULAFX_BUCKET_SOURCE_VERSION_ID)
            .map(|v| v.to_str().unwrap().to_owned())
    } else {
        vid
    };

    let vid = vid.map(|v| v.as_str().trim().to_owned());

    if let Some(ref id) = vid {
        if let Err(err) = Uuid::parse_str(id.as_str()) {
            error!("del_opts: invalid version id: {} error: {}", id, err);
            return Err(StorageError::InvalidVersionID(bucket.to_owned(), object.to_owned(), id.clone()));
        }

        if !versioned {
            error!("del_opts: object not versioned: {}", object);
            return Err(StorageError::InvalidArgument(bucket.to_owned(), object.to_owned(), id.clone()));
        }
    }

    let mut opts = put_opts_from_headers(headers, metadata.clone()).map_err(|err| {
        error!("del_opts: invalid argument: {} error: {}", object, err);
        StorageError::InvalidArgument(bucket.to_owned(), object.to_owned(), err.to_string())
    })?;

    opts.version_id = {
        if is_dir_object(object) && vid.is_none() {
            Some(Uuid::max().to_string())
        } else {
            vid
        }
    };
    opts.version_suspended = version_suspended;
    opts.versioned = versioned;

    opts.delete_marker = headers
        .get(NEUBULAFX_BUCKET_REPLICATION_DELETE_MARKER)
        .map(|v| v.to_str().unwrap() == "true")
        .unwrap_or_default();

    Ok(opts)
}

/// Creates options for getting an object from a bucket.
pub async fn get_opts(
    bucket: &str,
    object: &str,
    vid: Option<String>,
    part_num: Option<usize>,
    headers: &HeaderMap<HeaderValue>,
) -> Result<ObjectOptions> {
    let versioned = BucketVersioningSys::prefix_enabled(bucket, object).await;
    let version_suspended = BucketVersioningSys::prefix_suspended(bucket, object).await;

    let vid = vid.map(|v| v.as_str().trim().to_owned());

    if let Some(ref id) = vid {
        if let Err(_err) = Uuid::parse_str(id.as_str()) {
            return Err(StorageError::InvalidVersionID(bucket.to_owned(), object.to_owned(), id.clone()));
        }

        if !versioned {
            return Err(StorageError::InvalidArgument(bucket.to_owned(), object.to_owned(), id.clone()));
        }
    }

    let mut opts = get_default_opts(headers, HashMap::new(), false)
        .map_err(|err| StorageError::InvalidArgument(bucket.to_owned(), object.to_owned(), err.to_string()))?;

    opts.version_id = {
        if is_dir_object(object) && vid.is_none() {
            Some(Uuid::max().to_string())
        } else {
            vid
        }
    };

    opts.part_number = part_num;

    opts.version_suspended = version_suspended;
    opts.versioned = versioned;

    Ok(opts)
}

fn fill_conditional_writes_opts_from_header(headers: &HeaderMap<HeaderValue>, opts: &mut ObjectOptions) -> std::io::Result<()> {
    if headers.contains_key("If-None-Match") || headers.contains_key("If-Match") {
        let mut preconditions = HTTPPreconditions::default();
        if let Some(if_none_match) = headers.get("If-None-Match") {
            preconditions.if_none_match = Some(
                if_none_match
                    .to_str()
                    .map_err(|_| std::io::Error::other("Invalid If-None-Match header"))?
                    .to_string(),
            );
        }
        if let Some(if_match) = headers.get("If-Match") {
            preconditions.if_match = Some(
                if_match
                    .to_str()
                    .map_err(|_| std::io::Error::other("Invalid If-Match header"))?
                    .to_string(),
            );
        }

        opts.http_preconditions = Some(preconditions);
    }

    Ok(())
}

/// Creates options for putting an object in a bucket.
pub async fn put_opts(
    bucket: &str,
    object: &str,
    vid: Option<String>,
    headers: &HeaderMap<HeaderValue>,
    metadata: HashMap<String, String>,
) -> Result<ObjectOptions> {
    let versioned = BucketVersioningSys::prefix_enabled(bucket, object).await;
    let version_suspended = BucketVersioningSys::prefix_suspended(bucket, object).await;

    let vid = if vid.is_none() {
        headers
            .get(NEUBULAFX_BUCKET_SOURCE_VERSION_ID)
            .map(|v| v.to_str().unwrap().to_owned())
    } else {
        vid
    };

    let vid = vid.map(|v| v.as_str().trim().to_owned());

    if let Some(ref id) = vid {
        if let Err(_err) = Uuid::parse_str(id.as_str()) {
            return Err(StorageError::InvalidVersionID(bucket.to_owned(), object.to_owned(), id.clone()));
        }

        if !versioned {
            return Err(StorageError::InvalidArgument(bucket.to_owned(), object.to_owned(), id.clone()));
        }
    }

    let mut opts = put_opts_from_headers(headers, metadata)
        .map_err(|err| StorageError::InvalidArgument(bucket.to_owned(), object.to_owned(), err.to_string()))?;

    opts.version_id = {
        if is_dir_object(object) && vid.is_none() {
            Some(Uuid::max().to_string())
        } else {
            vid
        }
    };
    opts.version_suspended = version_suspended;
    opts.versioned = versioned;

    fill_conditional_writes_opts_from_header(headers, &mut opts)?;

    Ok(opts)
}

pub fn get_complete_multipart_upload_opts(headers: &HeaderMap<HeaderValue>) -> std::io::Result<ObjectOptions> {
    let mut user_defined = HashMap::new();

    let mut replication_request = false;
    if let Some(v) = headers.get(NEUBULAFX_BUCKET_REPLICATION_REQUEST) {
        user_defined.insert(
            format!("{RESERVED_METADATA_PREFIX_LOWER}Actual-Object-Size"),
            v.to_str().unwrap_or_default().to_owned(),
        );
        replication_request = true;
    }

    if let Some(v) = headers.get(NEUBULAFX_BUCKET_REPLICATION_SSEC_CHECKSUM) {
        user_defined.insert(
            NEUBULAFX_BUCKET_REPLICATION_SSEC_CHECKSUM.to_string(),
            v.to_str().unwrap_or_default().to_owned(),
        );
    }

    let mut opts = ObjectOptions {
        want_checksum: nebulafx_rio::get_content_checksum(headers)?,
        user_defined,
        replication_request,
        ..Default::default()
    };

    fill_conditional_writes_opts_from_header(headers, &mut opts)?;
    Ok(opts)
}

/// Creates options for copying an object in a bucket.
pub async fn copy_dst_opts(
    bucket: &str,
    object: &str,
    vid: Option<String>,
    headers: &HeaderMap<HeaderValue>,
    metadata: HashMap<String, String>,
) -> Result<ObjectOptions> {
    put_opts(bucket, object, vid, headers, metadata).await
}

pub fn copy_src_opts(_bucket: &str, _object: &str, headers: &HeaderMap<HeaderValue>) -> Result<ObjectOptions> {
    get_default_opts(headers, HashMap::new(), false)
}

pub fn put_opts_from_headers(headers: &HeaderMap<HeaderValue>, metadata: HashMap<String, String>) -> Result<ObjectOptions> {
    get_default_opts(headers, metadata, false)
}

/// Creates default options for getting an object from a bucket.
pub fn get_default_opts(
    _headers: &HeaderMap<HeaderValue>,
    metadata: HashMap<String, String>,
    _copy_source: bool,
) -> Result<ObjectOptions> {
    Ok(ObjectOptions {
        user_defined: metadata,
        ..Default::default()
    })
}

/// Extracts metadata from headers and returns it as a HashMap.
pub fn extract_metadata(headers: &HeaderMap<HeaderValue>) -> HashMap<String, String> {
    let mut metadata = HashMap::new();

    extract_metadata_from_mime(headers, &mut metadata);

    metadata
}

/// Extracts metadata from headers and returns it as a HashMap.
pub fn extract_metadata_from_mime(headers: &HeaderMap<HeaderValue>, metadata: &mut HashMap<String, String>) {
    extract_metadata_from_mime_with_object_name(headers, metadata, false, None);
}

/// Extracts metadata from headers and returns it as a HashMap with object name for MIME type detection.
pub fn extract_metadata_from_mime_with_object_name(
    headers: &HeaderMap<HeaderValue>,
    metadata: &mut HashMap<String, String>,
    skip_content_type: bool,
    object_name: Option<&str>,
) {
    for (k, v) in headers.iter() {
        if k.as_str() == "content-type" && skip_content_type {
            continue;
        }

        if let Some(key) = k.as_str().strip_prefix("x-amz-meta-") {
            if key.is_empty() {
                continue;
            }

            metadata.insert(key.to_owned(), String::from_utf8_lossy(v.as_bytes()).to_string());
            continue;
        }

        if let Some(key) = k.as_str().strip_prefix("x-nebulafx-meta-") {
            metadata.insert(key.to_owned(), String::from_utf8_lossy(v.as_bytes()).to_string());
            continue;
        }

        for hd in SUPPORTED_HEADERS.iter() {
            if k.as_str() == *hd {
                metadata.insert(k.to_string(), String::from_utf8_lossy(v.as_bytes()).to_string());
                continue;
            }
        }
    }

    if !metadata.contains_key("content-type") {
        let default_content_type = if let Some(obj_name) = object_name {
            detect_content_type_from_object_name(obj_name)
        } else {
            "binary/octet-stream".to_owned()
        };
        metadata.insert("content-type".to_owned(), default_content_type);
    }
}

pub(crate) fn filter_object_metadata(metadata: &HashMap<String, String>) -> Option<HashMap<String, String>> {
    let mut filtered_metadata = HashMap::new();
    for (k, v) in metadata {
        if k.starts_with(RESERVED_METADATA_PREFIX_LOWER) {
            continue;
        }
        if v.is_empty() && (k == &X_AMZ_OBJECT_LOCK_MODE.to_string() || k == &X_AMZ_OBJECT_LOCK_RETAIN_UNTIL_DATE.to_string()) {
            continue;
        }

        if k == AMZ_META_UNENCRYPTED_CONTENT_MD5 || k == AMZ_META_UNENCRYPTED_CONTENT_LENGTH {
            continue;
        }

        let lower_key = k.to_ascii_lowercase();
        if let Some(key) = lower_key.strip_prefix("x-amz-meta-") {
            filtered_metadata.insert(key.to_string(), v.to_string());
            continue;
        }
        if let Some(key) = lower_key.strip_prefix("x-nebulafx-meta-") {
            filtered_metadata.insert(key.to_string(), v.to_string());
            continue;
        }

        filtered_metadata.insert(k.clone(), v.clone());
    }
    if filtered_metadata.is_empty() {
        None
    } else {
        Some(filtered_metadata)
    }
}

/// Detects content type from object name based on file extension.
pub(crate) fn detect_content_type_from_object_name(object_name: &str) -> String {
    let lower_name = object_name.to_lowercase();

    // Check for Parquet files specifically
    if lower_name.ends_with(".parquet") {
        return "application/vnd.apache.parquet".to_owned();
    }

    // Special handling for other data formats that mime_guess doesn't know
    if lower_name.ends_with(".avro") {
        return "application/avro".to_owned();
    }
    if lower_name.ends_with(".orc") {
        return "application/orc".to_owned();
    }
    if lower_name.ends_with(".feather") {
        return "application/feather".to_owned();
    }
    if lower_name.ends_with(".arrow") {
        return "application/arrow".to_owned();
    }

    // Use mime_guess for standard file types
    mime_guess::from_path(object_name).first_or_octet_stream().to_string()
}

/// List of supported headers.
static SUPPORTED_HEADERS: LazyLock<Vec<&'static str>> = LazyLock::new(|| {
    vec![
        "content-type",
        "cache-control",
        "content-language",
        "content-encoding",
        "content-disposition",
        "x-amz-storage-class",
        "x-amz-tagging",
        "expires",
        "x-amz-replication-status",
    ]
});

/// Parse copy source range string in format "bytes=start-end"
pub fn parse_copy_source_range(range_str: &str) -> S3Result<HTTPRangeSpec> {
    if !range_str.starts_with("bytes=") {
        return Err(s3_error!(InvalidArgument, "Invalid range format"));
    }

    let range_part = &range_str[6..]; // Remove "bytes=" prefix

    if let Some(dash_pos) = range_part.find('-') {
        let start_str = &range_part[..dash_pos];
        let end_str = &range_part[dash_pos + 1..];

        if start_str.is_empty() && end_str.is_empty() {
            return Err(s3_error!(InvalidArgument, "Invalid range format"));
        }

        if start_str.is_empty() {
            // Suffix range: bytes=-500 (last 500 bytes)
            let length = end_str
                .parse::<i64>()
                .map_err(|_| s3_error!(InvalidArgument, "Invalid range format"))?;

            Ok(HTTPRangeSpec {
                is_suffix_length: true,
                start: -length,
                end: -1,
            })
        } else {
            let start = start_str
                .parse::<i64>()
                .map_err(|_| s3_error!(InvalidArgument, "Invalid range format"))?;

            let end = if end_str.is_empty() {
                -1 // Open-ended range: bytes=500-
            } else {
                end_str
                    .parse::<i64>()
                    .map_err(|_| s3_error!(InvalidArgument, "Invalid range format"))?
            };

            if start < 0 || (end != -1 && end < start) {
                return Err(s3_error!(InvalidArgument, "Invalid range format"));
            }

            Ok(HTTPRangeSpec {
                is_suffix_length: false,
                start,
                end,
            })
        }
    } else {
        Err(s3_error!(InvalidArgument, "Invalid range format"))
    }
}

pub(crate) fn get_content_sha256(headers: &HeaderMap<HeaderValue>) -> Option<String> {
    match get_request_auth_type(headers) {
        AuthType::Presigned | AuthType::Signed => {
            if skip_content_sha256_cksum(headers) {
                None
            } else {
                Some(get_content_sha256_cksum(headers, ServiceType::S3))
            }
        }
        _ => None,
    }
}

/// skip_content_sha256_cksum returns true if caller needs to skip
/// payload checksum, false if not.
fn skip_content_sha256_cksum(headers: &HeaderMap<HeaderValue>) -> bool {
    let content_sha256 = if is_request_presigned_signature_v4(headers) {
        // For presigned requests, check query params first, then headers
        // Note: In a real implementation, you would need to check query parameters
        // For now, we'll just check headers
        headers.get(AMZ_CONTENT_SHA256)
    } else {
        headers.get(AMZ_CONTENT_SHA256)
    };

    // Skip if no header was set
    let Some(header_value) = content_sha256 else {
        return true;
    };

    let Ok(value) = header_value.to_str() else {
        return true;
    };

    // If x-amz-content-sha256 is set and the value is not
    // 'UNSIGNED-PAYLOAD' we should validate the content sha256.
    match value {
        v if v == UNSIGNED_PAYLOAD || v == UNSIGNED_PAYLOAD_TRAILER => true,
        v if v == EMPTY_STRING_SHA256_HASH => {
            // some broken clients set empty-sha256
            // with > 0 content-length in the body,
            // we should skip such clients and allow
            // blindly such insecure clients only if
            // S3 strict compatibility is disabled.

            // We return true only in situations when
            // deployment has asked NebulaFX to allow for
            // such broken clients and content-length > 0.
            // For now, we'll assume strict compatibility is disabled
            // In a real implementation, you would check a global config
            if let Some(content_length) = headers.get("content-length") {
                if let Ok(length_str) = content_length.to_str() {
                    if let Ok(length) = length_str.parse::<i64>() {
                        return length > 0; // && !global_server_ctxt.strict_s3_compat
                    }
                }
            }
            false
        }
        _ => false,
    }
}

/// Returns SHA256 for calculating canonical-request.
fn get_content_sha256_cksum(headers: &HeaderMap<HeaderValue>, service_type: ServiceType) -> String {
    if service_type == ServiceType::STS {
        // For STS requests, we would need to read the body and calculate SHA256
        // This is a simplified implementation - in practice you'd need access to the request body
        // For now, we'll return a placeholder
        return "sts-body-sha256-placeholder".to_string();
    }

    let (default_sha256_cksum, content_sha256) = if is_request_presigned_signature_v4(headers) {
        // For a presigned request we look at the query param for sha256.
        // X-Amz-Content-Sha256, if not set in presigned requests, checksum
        // will default to 'UNSIGNED-PAYLOAD'.
        (UNSIGNED_PAYLOAD.to_string(), headers.get(AMZ_CONTENT_SHA256))
    } else {
        // X-Amz-Content-Sha256, if not set in signed requests, checksum
        // will default to sha256([]byte("")).
        (EMPTY_STRING_SHA256_HASH.to_string(), headers.get(AMZ_CONTENT_SHA256))
    };

    // We found 'X-Amz-Content-Sha256' return the captured value.
    if let Some(header_value) = content_sha256 {
        if let Ok(value) = header_value.to_str() {
            return value.to_string();
        }
    }

    // We couldn't find 'X-Amz-Content-Sha256'.
    default_sha256_cksum
}