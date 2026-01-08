/// Login error message constants
/// All error messages used in the login module are defined here for consistency and maintainability
pub mod messages {
    // Common errors
    pub const GET_CRED_FAILED: &str = "get cred failed";
    pub const GET_BODY_FAILED: &str = "get body failed";
    pub const IAM_NOT_INIT: &str = "iam not init";
    pub const GET_NEW_CRED_FAILED: &str = "get new cred failed";
    pub const SET_TEMP_USER_FAILED: &str = "set_temp_user failed";
    
    // Key Login errors
    pub const KEY_LOGIN_REQUIRES_PERMANENT_CRED: &str = "Key Login requires permanent credentials";
    
    // STS Login errors
    pub const STS_LOGIN_REQUIRES_PERMANENT_CRED: &str = "STS Login requires permanent credentials for AssumeRole";
    
    // Policy errors
    pub const INVALID_POLICY: &str = "invalid policy";
    pub const INVALID_POLICY_ARG: &str = "invalid policy arg";
    pub const POLICY_TOO_LARGE: &str = "policy too large";
    pub const PARSE_POLICY_ERR: &str = "parse policy err";
    pub const MARSHAL_POLICY_ERR: &str = "marshal policy err";
    
    // Request validation errors
    pub const NOT_SUPPORT_ACTION: &str = "not support action";
    pub const NOT_SUPPORT_VERSION: &str = "not support version";
    
    // Signing key errors
    pub const GLOBAL_ACTIVE_SK_NOT_INIT: &str = "global active sk not init";
}

