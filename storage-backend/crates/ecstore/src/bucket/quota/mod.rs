

use crate::error::Result;
use rmp_serde::Serializer as rmpSerializer;
use serde::{Deserialize, Serialize};

// Define the QuotaType enum
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum QuotaType {
    Hard,
}

// Define the BucketQuota structure
#[derive(Debug, Deserialize, Serialize, Default, Clone)]
pub struct BucketQuota {
    quota: Option<u64>, // Use Option to represent optional fields

    size: u64,

    rate: u64,

    requests: u64,

    quota_type: Option<QuotaType>,
}

impl BucketQuota {
    pub fn marshal_msg(&self) -> Result<Vec<u8>> {
        let mut buf = Vec::new();

        self.serialize(&mut rmpSerializer::new(&mut buf).with_struct_map())?;

        Ok(buf)
    }

    pub fn unmarshal(buf: &[u8]) -> Result<Self> {
        let t: BucketQuota = rmp_serde::from_slice(buf)?;
        Ok(t)
    }
}
