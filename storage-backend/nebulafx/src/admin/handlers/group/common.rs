use serde::Deserialize;

#[derive(Debug, Deserialize, Default)]
pub struct GroupQuery {
    pub group: String,
    pub status: Option<String>,
}

