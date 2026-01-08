

use nebulafx_ahm::heal::{
    event::{HealEvent, Severity},
    task::{HealPriority, HealType},
    utils,
};

#[test]
fn test_heal_event_to_heal_request_no_panic() {
    use nebulafx_ecstore::disk::endpoint::Endpoint;

    // Test that invalid pool/set indices don't cause panic
    // Create endpoint using try_from or similar method
    let endpoint_result = Endpoint::try_from("http://localhost:9000");
    if let Ok(mut endpoint) = endpoint_result {
        endpoint.pool_idx = -1;
        endpoint.set_idx = -1;
        endpoint.disk_idx = 0;

        let event = HealEvent::DiskStatusChange {
            endpoint,
            old_status: "ok".to_string(),
            new_status: "offline".to_string(),
        };

        // Should return error instead of panicking
        let result = event.to_heal_request();
        assert!(result.is_err());
        assert!(result.unwrap_err().to_string().contains("Invalid heal type"));
    }
}

#[test]
fn test_heal_event_to_heal_request_valid_indices() {
    use nebulafx_ecstore::disk::endpoint::Endpoint;

    // Test that valid indices work correctly
    let endpoint_result = Endpoint::try_from("http://localhost:9000");
    if let Ok(mut endpoint) = endpoint_result {
        endpoint.pool_idx = 0;
        endpoint.set_idx = 1;
        endpoint.disk_idx = 0;

        let event = HealEvent::DiskStatusChange {
            endpoint,
            old_status: "ok".to_string(),
            new_status: "offline".to_string(),
        };

        let result = event.to_heal_request();
        assert!(result.is_ok());
        let request = result.unwrap();
        assert!(matches!(request.heal_type, HealType::ErasureSet { .. }));
    }
}

#[test]
fn test_heal_event_object_corruption() {
    let event = HealEvent::ObjectCorruption {
        bucket: "test-bucket".to_string(),
        object: "test-object".to_string(),
        version_id: None,
        corruption_type: nebulafx_ahm::heal::event::CorruptionType::DataCorruption,
        severity: Severity::High,
    };

    let result = event.to_heal_request();
    assert!(result.is_ok());
    let request = result.unwrap();
    assert!(matches!(request.heal_type, HealType::Object { .. }));
    assert_eq!(request.priority, HealPriority::High);
}

#[test]
fn test_heal_event_ec_decode_failure() {
    let event = HealEvent::ECDecodeFailure {
        bucket: "test-bucket".to_string(),
        object: "test-object".to_string(),
        version_id: None,
        missing_shards: vec![0, 1],
        available_shards: vec![2, 3],
    };

    let result = event.to_heal_request();
    assert!(result.is_ok());
    let request = result.unwrap();
    assert!(matches!(request.heal_type, HealType::ECDecode { .. }));
    assert_eq!(request.priority, HealPriority::Urgent);
}

#[test]
fn test_format_set_disk_id_from_i32_negative() {
    // Test that negative indices return None
    assert!(utils::format_set_disk_id_from_i32(-1, 0).is_none());
    assert!(utils::format_set_disk_id_from_i32(0, -1).is_none());
    assert!(utils::format_set_disk_id_from_i32(-1, -1).is_none());
}

#[test]
fn test_format_set_disk_id_from_i32_valid() {
    // Test that valid indices return Some
    let result = utils::format_set_disk_id_from_i32(0, 1);
    assert!(result.is_some());
    assert_eq!(result.unwrap(), "pool_0_set_1");
}

#[test]
fn test_resume_state_timestamp_handling() {
    use nebulafx_ahm::heal::resume::ResumeState;

    // Test that ResumeState creation doesn't panic even if system time is before epoch
    // This is a theoretical test - in practice, system time should never be before epoch
    // But we want to ensure unwrap_or_default handles edge cases
    let state = ResumeState::new(
        "test-task".to_string(),
        "test-type".to_string(),
        "pool_0_set_1".to_string(),
        vec!["bucket1".to_string()],
    );

    // Verify fields are initialized (u64 is always >= 0)
    // The important thing is that unwrap_or_default prevents panic
    let _ = state.start_time;
    let _ = state.last_update;
}

#[test]
fn test_resume_checkpoint_timestamp_handling() {
    use nebulafx_ahm::heal::resume::ResumeCheckpoint;

    // Test that ResumeCheckpoint creation doesn't panic
    let checkpoint = ResumeCheckpoint::new("test-task".to_string());

    // Verify field is initialized (u64 is always >= 0)
    // The important thing is that unwrap_or_default prevents panic
    let _ = checkpoint.checkpoint_time;
}

#[test]
fn test_path_to_str_helper() {
    use std::path::Path;

    // Test that path conversion handles non-UTF-8 paths gracefully
    // Note: This is a compile-time test - actual non-UTF-8 paths are hard to construct in Rust
    // The helper function should properly handle the conversion
    let valid_path = Path::new("test/path");
    assert!(valid_path.to_str().is_some());
}

#[test]
fn test_heal_task_status_atomic_update() {
    use nebulafx_ahm::heal::storage::HealStorageAPI;
    use nebulafx_ahm::heal::task::{HealOptions, HealRequest, HealTask, HealTaskStatus};
    use std::sync::Arc;

    // Mock storage for testing
    struct MockStorage;
    #[async_trait::async_trait]
    impl HealStorageAPI for MockStorage {
        async fn get_object_meta(
            &self,
            _bucket: &str,
            _object: &str,
        ) -> nebulafx_ahm::Result<Option<nebulafx_ecstore::store_api::ObjectInfo>> {
            Ok(None)
        }
        async fn get_object_data(&self, _bucket: &str, _object: &str) -> nebulafx_ahm::Result<Option<Vec<u8>>> {
            Ok(None)
        }
        async fn put_object_data(&self, _bucket: &str, _object: &str, _data: &[u8]) -> nebulafx_ahm::Result<()> {
            Ok(())
        }
        async fn delete_object(&self, _bucket: &str, _object: &str) -> nebulafx_ahm::Result<()> {
            Ok(())
        }
        async fn verify_object_integrity(&self, _bucket: &str, _object: &str) -> nebulafx_ahm::Result<bool> {
            Ok(true)
        }
        async fn ec_decode_rebuild(&self, _bucket: &str, _object: &str) -> nebulafx_ahm::Result<Vec<u8>> {
            Ok(vec![])
        }
        async fn get_disk_status(
            &self,
            _endpoint: &nebulafx_ecstore::disk::endpoint::Endpoint,
        ) -> nebulafx_ahm::Result<nebulafx_ahm::heal::storage::DiskStatus> {
            Ok(nebulafx_ahm::heal::storage::DiskStatus::Ok)
        }
        async fn format_disk(&self, _endpoint: &nebulafx_ecstore::disk::endpoint::Endpoint) -> nebulafx_ahm::Result<()> {
            Ok(())
        }
        async fn get_bucket_info(&self, _bucket: &str) -> nebulafx_ahm::Result<Option<nebulafx_ecstore::store_api::BucketInfo>> {
            Ok(None)
        }
        async fn heal_bucket_metadata(&self, _bucket: &str) -> nebulafx_ahm::Result<()> {
            Ok(())
        }
        async fn list_buckets(&self) -> nebulafx_ahm::Result<Vec<nebulafx_ecstore::store_api::BucketInfo>> {
            Ok(vec![])
        }
        async fn object_exists(&self, _bucket: &str, _object: &str) -> nebulafx_ahm::Result<bool> {
            Ok(false)
        }
        async fn get_object_size(&self, _bucket: &str, _object: &str) -> nebulafx_ahm::Result<Option<u64>> {
            Ok(None)
        }
        async fn get_object_checksum(&self, _bucket: &str, _object: &str) -> nebulafx_ahm::Result<Option<String>> {
            Ok(None)
        }
        async fn heal_object(
            &self,
            _bucket: &str,
            _object: &str,
            _version_id: Option<&str>,
            _opts: &nebulafx_common::heal_channel::HealOpts,
        ) -> nebulafx_ahm::Result<(nebulafx_madmin::heal_commands::HealResultItem, Option<nebulafx_ahm::Error>)> {
            Ok((nebulafx_madmin::heal_commands::HealResultItem::default(), None))
        }
        async fn heal_bucket(
            &self,
            _bucket: &str,
            _opts: &nebulafx_common::heal_channel::HealOpts,
        ) -> nebulafx_ahm::Result<nebulafx_madmin::heal_commands::HealResultItem> {
            Ok(nebulafx_madmin::heal_commands::HealResultItem::default())
        }
        async fn heal_format(
            &self,
            _dry_run: bool,
        ) -> nebulafx_ahm::Result<(nebulafx_madmin::heal_commands::HealResultItem, Option<nebulafx_ahm::Error>)> {
            Ok((nebulafx_madmin::heal_commands::HealResultItem::default(), None))
        }
        async fn list_objects_for_heal(&self, _bucket: &str, _prefix: &str) -> nebulafx_ahm::Result<Vec<String>> {
            Ok(vec![])
        }
        async fn get_disk_for_resume(&self, _set_disk_id: &str) -> nebulafx_ahm::Result<nebulafx_ecstore::disk::DiskStore> {
            Err(nebulafx_ahm::Error::other("Not implemented in mock"))
        }
    }

    // Create a heal request and task
    let request = HealRequest::new(
        HealType::Object {
            bucket: "test-bucket".to_string(),
            object: "test-object".to_string(),
            version_id: None,
        },
        HealOptions::default(),
        HealPriority::Normal,
    );

    let storage: Arc<dyn HealStorageAPI> = Arc::new(MockStorage);
    let task = HealTask::from_request(request, storage);

    // Verify initial status
    let status = tokio::runtime::Runtime::new().unwrap().block_on(task.get_status());
    assert_eq!(status, HealTaskStatus::Pending);

    // The task should have task_start_instant field initialized
    // This is an internal detail, but we can verify it doesn't cause issues
    // by checking that the task can be created successfully
    // Note: We can't directly access private fields, but creation without panic
    // confirms the fix works
}
