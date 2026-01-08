use serde::Deserialize;

#[derive(Debug, Deserialize, Default)]
pub struct BucketQuery {
    pub bucket: String,
}

#[derive(Debug, Deserialize, Default)]
pub struct PolicyNameQuery {
    pub name: String,
}

#[derive(Debug, Deserialize, Default)]
pub struct SetPolicyForUserOrGroupQuery {
    #[serde(rename = "policyName")]
    pub policy_name: String,
    #[serde(rename = "userOrGroup")]
    pub user_or_group: String,
    #[serde(rename = "isGroup")]
    pub is_group: bool,
}

