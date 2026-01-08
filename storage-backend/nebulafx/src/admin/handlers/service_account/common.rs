use serde::Deserialize;

#[derive(Debug, Default, Deserialize)]
pub struct AccessKeyQuery {
    #[serde(rename = "accessKey")]
    pub access_key: String,
}

#[derive(Debug, Default, Deserialize)]
pub struct ListServiceAccountQuery {
    pub user: Option<String>,
}

