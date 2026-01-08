

pub const AMZ_META_UNENCRYPTED_CONTENT_LENGTH: &str = "X-Amz-Meta-X-Amz-Unencrypted-Content-Length";
pub const AMZ_META_UNENCRYPTED_CONTENT_MD5: &str = "X-Amz-Meta-X-Amz-Unencrypted-Content-Md5";

pub const AMZ_STORAGE_CLASS: &str = "x-amz-storage-class";

pub const RESERVED_METADATA_PREFIX: &str = "X-NebulaFX-Internal-";
pub const RESERVED_METADATA_PREFIX_LOWER: &str = "x-nebulafx-internal-";

pub const NEUBULAFX_HEALING: &str = "X-NEUBULAFX-Internal-healing";
// pub const NEUBULAFX_DATA_MOVE: &str = "X-NEUBULAFX-Internal-data-mov";

// pub const X_NEUBULAFX_INLINE_DATA: &str = "x-nebulafx-inline-data";

pub const VERSION_PURGE_STATUS_KEY: &str = "X-NEUBULAFX-Internal-purgestatus";

pub const X_NEUBULAFX_HEALING: &str = "X-NEUBULAFX-Internal-healing";
pub const X_NEUBULAFX_DATA_MOV: &str = "X-NEUBULAFX-Internal-data-mov";

pub const AMZ_OBJECT_TAGGING: &str = "X-Amz-Tagging";
pub const AMZ_BUCKET_REPLICATION_STATUS: &str = "X-Amz-Replication-Status";
pub const AMZ_DECODED_CONTENT_LENGTH: &str = "X-Amz-Decoded-Content-Length";

pub const NEUBULAFX_DATA_MOVE: &str = "X-NEUBULAFX-Internal-data-mov";

// Server-side encryption headers
pub const AMZ_SERVER_SIDE_ENCRYPTION: &str = "x-amz-server-side-encryption";
pub const AMZ_SERVER_SIDE_ENCRYPTION_AWS_KMS_KEY_ID: &str = "x-amz-server-side-encryption-aws-kms-key-id";
pub const AMZ_SERVER_SIDE_ENCRYPTION_CONTEXT: &str = "x-amz-server-side-encryption-context";
pub const AMZ_SERVER_SIDE_ENCRYPTION_CUSTOMER_ALGORITHM: &str = "x-amz-server-side-encryption-customer-algorithm";
pub const AMZ_SERVER_SIDE_ENCRYPTION_CUSTOMER_KEY: &str = "x-amz-server-side-encryption-customer-key";
pub const AMZ_SERVER_SIDE_ENCRYPTION_CUSTOMER_KEY_MD5: &str = "x-amz-server-side-encryption-customer-key-md5";

// SSE-C copy source headers
pub const AMZ_COPY_SOURCE_SERVER_SIDE_ENCRYPTION_CUSTOMER_ALGORITHM: &str =
    "x-amz-copy-source-server-side-encryption-customer-algorithm";
pub const AMZ_COPY_SOURCE_SERVER_SIDE_ENCRYPTION_CUSTOMER_KEY: &str = "x-amz-copy-source-server-side-encryption-customer-key";
pub const AMZ_COPY_SOURCE_SERVER_SIDE_ENCRYPTION_CUSTOMER_KEY_MD5: &str =
    "x-amz-copy-source-server-side-encryption-customer-key-md5";
