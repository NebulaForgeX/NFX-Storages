

//! KMS (Key Management Service) End-to-End Tests
//!
//! This module contains comprehensive end-to-end tests for NebulaFX KMS functionality,
//! including tests for both Local and Vault backends.

// KMS-specific common utilities
#[cfg(test)]
pub mod common;

#[cfg(test)]
mod kms_local_test;

#[cfg(test)]
mod kms_vault_test;

#[cfg(test)]
mod kms_comprehensive_test;

#[cfg(test)]
mod multipart_encryption_test;

#[cfg(test)]
mod kms_edge_cases_test;

#[cfg(test)]
mod kms_fault_recovery_test;

#[cfg(test)]
mod test_runner;

#[cfg(test)]
mod bucket_default_encryption_test;

#[cfg(test)]
mod encryption_metadata_test;
