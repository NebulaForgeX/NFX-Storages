

pub const DEFAULT_ARN_PARTITION: &str = "nebulafx";

pub const DEFAULT_ARN_SERVICE: &str = "sqs";

/// Default ARN prefix for SQS
/// "arn:nebulafx:sqs:"
pub const ARN_PREFIX: &str = const_str::concat!("arn:", DEFAULT_ARN_PARTITION, ":", DEFAULT_ARN_SERVICE, ":");
