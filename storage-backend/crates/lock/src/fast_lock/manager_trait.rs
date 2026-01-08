

//! Unified trait for lock managers (enabled and disabled)

use crate::fast_lock::{
    guard::FastLockGuard,
    metrics::AggregatedMetrics,
    types::{BatchLockRequest, BatchLockResult, LockResult, ObjectKey, ObjectLockInfo, ObjectLockRequest},
};
use std::sync::Arc;

/// Unified trait for lock managers
///
/// This trait allows transparent switching between enabled and disabled lock managers
/// based on environment variables.
#[async_trait::async_trait]
pub trait LockManager: Send + Sync {
    /// Acquire object lock
    async fn acquire_lock(&self, request: ObjectLockRequest) -> Result<FastLockGuard, LockResult>;

    /// Acquire shared (read) lock
    async fn acquire_read_lock(
        &self,
        bucket: impl Into<Arc<str>> + Send,
        object: impl Into<Arc<str>> + Send,
        owner: impl Into<Arc<str>> + Send,
    ) -> Result<FastLockGuard, LockResult>;

    /// Acquire shared (read) lock for specific version
    async fn acquire_read_lock_versioned(
        &self,
        bucket: impl Into<Arc<str>> + Send,
        object: impl Into<Arc<str>> + Send,
        version: impl Into<Arc<str>> + Send,
        owner: impl Into<Arc<str>> + Send,
    ) -> Result<FastLockGuard, LockResult>;

    /// Acquire exclusive (write) lock
    async fn acquire_write_lock(
        &self,
        bucket: impl Into<Arc<str>> + Send,
        object: impl Into<Arc<str>> + Send,
        owner: impl Into<Arc<str>> + Send,
    ) -> Result<FastLockGuard, LockResult>;

    /// Acquire exclusive (write) lock for specific version
    async fn acquire_write_lock_versioned(
        &self,
        bucket: impl Into<Arc<str>> + Send,
        object: impl Into<Arc<str>> + Send,
        version: impl Into<Arc<str>> + Send,
        owner: impl Into<Arc<str>> + Send,
    ) -> Result<FastLockGuard, LockResult>;

    /// Acquire multiple locks atomically
    async fn acquire_locks_batch(&self, batch_request: BatchLockRequest) -> BatchLockResult;

    /// Get lock information for monitoring
    fn get_lock_info(&self, key: &ObjectKey) -> Option<ObjectLockInfo>;

    /// Get aggregated metrics
    fn get_metrics(&self) -> AggregatedMetrics;

    /// Get total number of active locks across all shards
    fn total_lock_count(&self) -> usize;

    /// Get pool statistics from all shards
    fn get_pool_stats(&self) -> Vec<(u64, u64, u64, usize)>;

    /// Force cleanup of expired locks
    async fn cleanup_expired(&self) -> usize;

    /// Force cleanup with traditional strategy
    async fn cleanup_expired_traditional(&self) -> usize;

    /// Shutdown the lock manager and cleanup resources
    async fn shutdown(&self);

    /// Check if this manager is disabled
    fn is_disabled(&self) -> bool;
}
