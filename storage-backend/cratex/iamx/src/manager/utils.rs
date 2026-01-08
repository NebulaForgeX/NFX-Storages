// Utility functions for IAM manager

use crate::error::{Error, Result};
use crate::sys::get_claims_from_token_with_secret;
use crate::types::MappedPolicy;
use nebulafx_ecstore::global::get_global_action_cred;
use nebulafx_policy::{
    auth::UserIdentity,
    policy::{Policy, PolicyDoc, default::DEFAULT_POLICIES},
};
use serde_json::Value;
use std::collections::HashMap;

/// Get default policies
pub fn get_default_policyes() -> HashMap<String, PolicyDoc> {
    let default_policies = &DEFAULT_POLICIES;
    default_policies
        .iter()
        .map(|(n, p)| {
            (
                n.to_string(),
                PolicyDoc {
                    version: 1,
                    policy: p.clone(),
                    ..Default::default()
                },
            )
        })
        .collect()
}

/// Set default canned policies
pub(crate) fn set_default_canned_policies(policies: &mut HashMap<String, PolicyDoc>) {
    let default_policies = &DEFAULT_POLICIES;
    for (k, v) in default_policies.iter() {
        let name = k.to_string();
        policies.entry(name).or_insert_with(|| PolicyDoc::default_policy(v.clone()));
    }
}

/// Get token signing key from global action credentials
pub fn get_token_signing_key() -> Option<String> {
    if let Some(s) = get_global_action_cred() {
        Some(s.secret_key.clone())
    } else {
        None
    }
}

/// Extract JWT claims from user identity
pub fn extract_jwt_claims(u: &UserIdentity) -> Result<HashMap<String, Value>> {
    let Some(sys_key) = get_token_signing_key() else {
        return Err(Error::other("global active sk not init"));
    };

    let keys = vec![&sys_key, &u.credentials.secret_key];

    for key in keys {
        if let Ok(claims) = get_claims_from_token_with_secret(&u.credentials.session_token, key) {
            return Ok(claims);
        }
    }
    Err(Error::other("unable to extract claims"))
}

/// Filter policies by bucket name
pub(crate) fn filter_policies(policy_docs: &HashMap<String, PolicyDoc>, policy_name: &str, bucket_name: &str) -> (String, Policy) {
    let mp = MappedPolicy::new(policy_name).to_slice();

    let mut policies = Vec::new();
    let mut to_merge = Vec::new();
    for policy in mp {
        if policy.is_empty() {
            continue;
        }

        if let Some(p) = policy_docs.get(&policy) {
            if bucket_name.is_empty() || p.policy.match_resource(bucket_name) {
                policies.push(policy);
                to_merge.push(p.policy.clone());
            }
        }
    }

    (policies.join(","), Policy::merge_policies(to_merge))
}

