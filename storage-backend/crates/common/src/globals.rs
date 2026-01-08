

#![allow(non_upper_case_globals)] // FIXME

use std::collections::HashMap;
use std::sync::LazyLock;
use tokio::sync::RwLock;
use tonic::transport::Channel;

pub static GLOBAL_Local_Node_Name: LazyLock<RwLock<String>> = LazyLock::new(|| RwLock::new("".to_string()));
pub static GLOBAL_NEUBULAFX_Host: LazyLock<RwLock<String>> = LazyLock::new(|| RwLock::new("".to_string()));
pub static GLOBAL_NEUBULAFX_Port: LazyLock<RwLock<String>> = LazyLock::new(|| RwLock::new("9000".to_string()));
pub static GLOBAL_NEUBULAFX_Addr: LazyLock<RwLock<String>> = LazyLock::new(|| RwLock::new("".to_string()));
pub static GLOBAL_Conn_Map: LazyLock<RwLock<HashMap<String, Channel>>> = LazyLock::new(|| RwLock::new(HashMap::new()));

pub async fn set_global_addr(addr: &str) {
    *GLOBAL_NEUBULAFX_Addr.write().await = addr.to_string();
}
