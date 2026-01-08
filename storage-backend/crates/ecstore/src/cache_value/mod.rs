

use std::sync::Arc;

use lazy_static::lazy_static;
use tokio_util::sync::CancellationToken;

pub mod metacache_set;

lazy_static! {
    pub static ref LIST_PATH_RAW_CANCEL_TOKEN: Arc<CancellationToken> = Arc::new(CancellationToken::new());
}
