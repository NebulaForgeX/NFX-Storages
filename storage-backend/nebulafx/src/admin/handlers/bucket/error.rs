/// Bucket metadata error message constants
/// All error messages used in the bucket module are defined here for consistency and maintainability
pub mod messages {
    // Common errors
    pub const GET_CRED_FAILED: &str = "get cred failed";
    pub const GET_BODY_FAILED: &str = "get body failed";
    pub const GET_QUERY_FAILED: &str = "get query failed";
    pub const OBJECT_STORE_NOT_INIT: &str = "object store not init";
    
    // Export errors
    pub const LIST_BUCKETS_FAILED: &str = "list buckets failed";
    pub const GET_BUCKET_FAILED: &str = "get bucket failed";
    pub const GET_BUCKET_METADATA_FAILED: &str = "get bucket metadata failed";
    pub const SERIALIZE_CONFIG_FAILED: &str = "serialize config failed";
    pub const START_FILE_FAILED: &str = "start file failed";
    pub const WRITE_FILE_FAILED: &str = "write file failed";
    pub const FINISH_ZIP_FAILED: &str = "finish zip failed";
    
    // Import errors
    pub const GET_FILE_FAILED: &str = "get file failed";
    pub const READ_FILE_FAILED: &str = "read file failed";
    pub const DESERIALIZE_CONFIG_FAILED: &str = "deserialize config failed";
    pub const CREATE_BUCKET_FAILED: &str = "create bucket failed";
}

