use serde::Deserialize;

#[derive(Debug, Deserialize, Default)]
pub struct AddUserQuery {
    #[serde(rename = "accessKey")]
    pub access_key: Option<String>,
    pub status: Option<String>,
}

#[derive(Debug, Deserialize, Default)]
pub struct BucketQuery {
    #[serde(rename = "bucket")]
    pub bucket: String,
}

// IAM export/import constants
pub const ALL_POLICIES_FILE: &str = "policies.json";
pub const ALL_USERS_FILE: &str = "users.json";
pub const ALL_GROUPS_FILE: &str = "groups.json";
pub const ALL_SVC_ACCTS_FILE: &str = "svcaccts.json";
pub const USER_POLICY_MAPPINGS_FILE: &str = "user_mappings.json";
pub const GROUP_POLICY_MAPPINGS_FILE: &str = "group_mappings.json";
pub const STS_USER_POLICY_MAPPINGS_FILE: &str = "stsuser_mappings.json";

pub const IAM_ASSETS_DIR: &str = "iam-assets";

pub const IAM_EXPORT_FILES: &[&str] = &[
    ALL_POLICIES_FILE,
    ALL_USERS_FILE,
    ALL_GROUPS_FILE,
    ALL_SVC_ACCTS_FILE,
    USER_POLICY_MAPPINGS_FILE,
    GROUP_POLICY_MAPPINGS_FILE,
    STS_USER_POLICY_MAPPINGS_FILE,
];

