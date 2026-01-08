

use s3s::dto::ReplicaModificationsStatus;
use s3s::dto::ReplicationRule;

use super::ObjectOpts;

pub trait ReplicationRuleExt {
    fn prefix(&self) -> &str;
    fn metadata_replicate(&self, obj: &ObjectOpts) -> bool;
}

impl ReplicationRuleExt for ReplicationRule {
    fn prefix(&self) -> &str {
        if let Some(filter) = &self.filter {
            if let Some(prefix) = &filter.prefix {
                prefix
            } else if let Some(and) = &filter.and {
                and.prefix.as_deref().unwrap_or("")
            } else {
                ""
            }
        } else {
            ""
        }
    }

    fn metadata_replicate(&self, obj: &ObjectOpts) -> bool {
        if !obj.replica {
            return true;
        }

        self.source_selection_criteria.as_ref().is_some_and(|s| {
            s.replica_modifications
                .clone()
                .is_some_and(|r| r.status == ReplicaModificationsStatus::from_static(ReplicaModificationsStatus::ENABLED))
        })
    }
}
