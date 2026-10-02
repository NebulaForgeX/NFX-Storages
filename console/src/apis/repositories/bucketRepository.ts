import {
  CreateBucketCommand,
  DeleteBucketCommand,
  DeleteBucketEncryptionCommand,
  DeleteBucketLifecycleCommand,
  DeleteBucketReplicationCommand,
  DeleteBucketTaggingCommand,
  GetBucketEncryptionCommand,
  GetBucketLifecycleConfigurationCommand,
  GetBucketNotificationConfigurationCommand,
  GetBucketPolicyCommand,
  GetBucketPolicyStatusCommand,
  GetBucketReplicationCommand,
  GetBucketTaggingCommand,
  GetBucketVersioningCommand,
  GetObjectLockConfigurationCommand,
  HeadBucketCommand,
  ListBucketsCommand,
  PutBucketEncryptionCommand,
  PutBucketLifecycleConfigurationCommand,
  PutBucketNotificationConfigurationCommand,
  PutBucketPolicyCommand,
  PutBucketReplicationCommand,
  PutBucketTaggingCommand,
  PutBucketVersioningCommand,
  PutObjectLockConfigurationCommand,
  BucketVersioningStatus,
} from "@aws-sdk/client-s3";

import { createAdminApiClient, createS3Client } from "@/apis/s3";

export const bucketRepository = {
  listBuckets: () => createS3Client().send(new ListBucketsCommand({})),
  createBucket: (params: { Bucket: string }) => createS3Client().send(new CreateBucketCommand(params)),
  headBucket: (bucket: string) => createS3Client().send(new HeadBucketCommand({ Bucket: bucket })),
  deleteBucket: (bucket: string) => createS3Client().send(new DeleteBucketCommand({ Bucket: bucket })),
  getBucketTagging: (bucket: string) => createS3Client().send(new GetBucketTaggingCommand({ Bucket: bucket })),
  putBucketTagging: (bucket: string, tagging: { TagSet: Array<{ Key: string; Value: string }> }) =>
    createS3Client().send(new PutBucketTaggingCommand({ Bucket: bucket, Tagging: tagging })),
  deleteBucketTagging: (bucket: string) => createS3Client().send(new DeleteBucketTaggingCommand({ Bucket: bucket })),
  putBucketVersioning: (bucket: string, status: string) =>
    createS3Client().send(
      new PutBucketVersioningCommand({
        Bucket: bucket,
        VersioningConfiguration: {
          Status: status === "Enabled" ? BucketVersioningStatus.Enabled : BucketVersioningStatus.Suspended,
        },
      }),
    ),
  getBucketVersioning: (bucket: string) => createS3Client().send(new GetBucketVersioningCommand({ Bucket: bucket })),
  getBucketPolicy: (bucket: string) => createS3Client().send(new GetBucketPolicyCommand({ Bucket: bucket })),
  getBucketPolicyStatus: (bucket: string) => createS3Client().send(new GetBucketPolicyStatusCommand({ Bucket: bucket })),
  putBucketPolicy: (bucket: string, policy: string) =>
    createS3Client().send(new PutBucketPolicyCommand({ Bucket: bucket, Policy: policy })),
  getObjectLockConfiguration: (bucket: string) => createS3Client().send(new GetObjectLockConfigurationCommand({ Bucket: bucket })),
  putObjectLockConfiguration: (bucket: string, objectLockConfiguration: object) =>
    createS3Client().send(
      new PutObjectLockConfigurationCommand({ Bucket: bucket, ObjectLockConfiguration: objectLockConfiguration as never }),
    ),
  getBucketLifecycleConfiguration: (bucket: string) =>
    createS3Client().send(new GetBucketLifecycleConfigurationCommand({ Bucket: bucket })),
  putBucketLifecycleConfiguration: (bucket: string, lifecycleConfiguration: object) =>
    createS3Client().send(
      new PutBucketLifecycleConfigurationCommand({ Bucket: bucket, LifecycleConfiguration: lifecycleConfiguration as never }),
    ),
  deleteBucketLifecycle: (bucket: string) => createS3Client().send(new DeleteBucketLifecycleCommand({ Bucket: bucket })),
  getBucketEncryption: (bucket: string) => createS3Client().send(new GetBucketEncryptionCommand({ Bucket: bucket })),
  putBucketEncryption: (bucket: string, encryption: object) =>
    createS3Client().send(new PutBucketEncryptionCommand({ Bucket: bucket, ServerSideEncryptionConfiguration: encryption as never })),
  deleteBucketEncryption: (bucket: string) => createS3Client().send(new DeleteBucketEncryptionCommand({ Bucket: bucket })),
  getBucketReplication: (bucket: string) => createS3Client().send(new GetBucketReplicationCommand({ Bucket: bucket })),
  putBucketReplication: (bucket: string, replication: object) =>
    createS3Client().send(new PutBucketReplicationCommand({ Bucket: bucket, ReplicationConfiguration: replication as never })),
  deleteBucketReplication: (bucket: string) => createS3Client().send(new DeleteBucketReplicationCommand({ Bucket: bucket })),
  listBucketNotifications: (bucket: string) =>
    createS3Client().send(new GetBucketNotificationConfigurationCommand({ Bucket: bucket })),
  putBucketNotifications: (bucket: string, data: object) =>
    createS3Client().send(new PutBucketNotificationConfigurationCommand({ Bucket: bucket, NotificationConfiguration: data as never })),
  setRemoteReplicationTarget: (bucket: string, data: unknown) =>
    createAdminApiClient().put(`/set-remote-target?bucket=${encodeURIComponent(bucket)}`, data),
  listRemoteReplicationTarget: (bucket: string) =>
    createAdminApiClient().get(`/list-remote-targets?bucket=${encodeURIComponent(bucket)}&type=`),
  deleteRemoteReplicationTarget: (bucket: string, arn: string) =>
    createAdminApiClient().delete(`/remove-remote-target?bucket=${encodeURIComponent(bucket)}&arn=${encodeURIComponent(arn)}`),
};
