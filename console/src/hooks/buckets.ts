import { useMutation, useQuery } from "@tanstack/react-query";

import { STORAGES_QUERY_KEYS } from "@/constants/storages.query.key";
import { invalidateEventEmitter, invalidateEvents } from "@/events/invalidate";
import { useStorageRepositories } from "@/apis/repositories";
import { niceBytes } from "@/utils/functions";

export function useBuckets() {
  const repos = useStorageRepositories();
  return useQuery({
    queryKey: STORAGES_QUERY_KEYS.buckets,
    queryFn: async () => {
      const response = await repos.buckets.listBuckets();
      let usage: Record<string, { objects_count?: number; size?: number }> = {};
      try {
        const usageInfo = await repos.system.getDataUsageInfo();
        usage = (usageInfo?.buckets_usage ?? {}) as typeof usage;
      } catch {
        usage = {};
      }
      return (response.Buckets ?? [])
        .filter((item): item is { Name: string; CreationDate?: Date } => Boolean(item.Name))
        .map((item) => ({
          Name: item.Name,
          CreationDate: item.CreationDate ? new Date(item.CreationDate).toISOString() : "",
          Count: usage[item.Name]?.objects_count ?? 0,
          Size: niceBytes(String(usage[item.Name]?.size ?? 0)),
        }))
        .sort((a, b) => a.Name.localeCompare(b.Name));
    },
  });
}

export function useCreateBucket() {
  const repos = useStorageRepositories();
  return useMutation({
    mutationFn: (name: string) => repos.buckets.createBucket({ Bucket: name }),
    onSuccess: () => invalidateEventEmitter.emit(invalidateEvents.BUCKETS),
  });
}

export function useDeleteBucket() {
  const repos = useStorageRepositories();
  return useMutation({
    mutationFn: (name: string) => repos.buckets.deleteBucket(name),
    onSuccess: () => invalidateEventEmitter.emit(invalidateEvents.BUCKETS),
  });
}

export function useBucketSettings(bucket: string) {
  const repos = useStorageRepositories();
  return useQuery({
    queryKey: STORAGES_QUERY_KEYS.bucketSettings(bucket),
    enabled: Boolean(bucket),
    queryFn: async () => {
      const [versioning, policy, policyStatus, encryption, tagging, objectLock] = await Promise.allSettled([
        repos.buckets.getBucketVersioning(bucket),
        repos.buckets.getBucketPolicy(bucket),
        repos.buckets.getBucketPolicyStatus(bucket),
        repos.buckets.getBucketEncryption(bucket),
        repos.buckets.getBucketTagging(bucket),
        repos.buckets.getObjectLockConfiguration(bucket),
      ]);
      const tags =
        tagging.status === "fulfilled"
          ? (tagging.value.TagSet ?? []).map((tag) => ({ Key: tag.Key ?? "", Value: tag.Value ?? "" }))
          : [];
      const lock = objectLock.status === "fulfilled" ? objectLock.value.ObjectLockConfiguration : undefined;
      const sse = encryption.status === "fulfilled" ? encryption.value.ServerSideEncryptionConfiguration : undefined;
      const algorithm = sse?.Rules?.[0]?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm;
      return {
        versioning: versioning.status === "fulfilled" ? versioning.value.Status : "-",
        policy: policy.status === "fulfilled" ? (policy.value.Policy ?? "") : "",
        policyPublic: policyStatus.status === "fulfilled" ? Boolean(policyStatus.value.PolicyStatus?.IsPublic) : false,
        encryption: encryption.status === "fulfilled" ? JSON.stringify(sse ?? {}) : "",
        encryptionAlgorithm: algorithm ?? "",
        tags,
        objectLockEnabled: lock?.ObjectLockEnabled === "Enabled",
        objectLockMode: lock?.Rule?.DefaultRetention?.Mode ?? "GOVERNANCE",
        objectLockDays: lock?.Rule?.DefaultRetention?.Days ?? 1,
      };
    },
  });
}

export function useSetBucketVersioning() {
  const repos = useStorageRepositories();
  return useMutation({
    mutationFn: (body: { bucket: string; status: string }) => repos.buckets.putBucketVersioning(body.bucket, body.status),
    onSuccess: () => invalidateEventEmitter.emit(invalidateEvents.BUCKET_SETTINGS),
  });
}

export function useSetBucketPolicy() {
  const repos = useStorageRepositories();
  return useMutation({
    mutationFn: (body: { bucket: string; policy: string }) => repos.buckets.putBucketPolicy(body.bucket, body.policy),
    onSuccess: () => invalidateEventEmitter.emit(invalidateEvents.BUCKET_SETTINGS),
  });
}

export function useSetBucketEncryption() {
  const repos = useStorageRepositories();
  return useMutation({
    mutationFn: (bucket: string) =>
      repos.buckets.putBucketEncryption(bucket, {
        Rules: [{ ApplyServerSideEncryptionByDefault: { SSEAlgorithm: "AES256" } }],
      }),
    onSuccess: () => invalidateEventEmitter.emit(invalidateEvents.BUCKET_SETTINGS),
  });
}

export function useDeleteBucketEncryption() {
  const repos = useStorageRepositories();
  return useMutation({
    mutationFn: (bucket: string) => repos.buckets.deleteBucketEncryption(bucket),
    onSuccess: () => invalidateEventEmitter.emit(invalidateEvents.BUCKET_SETTINGS),
  });
}

export interface LifecycleRule {
  ID?: string;
  Status?: string;
  Filter?: { Prefix?: string };
  Expiration?: { Days?: number };
}

export function useLifecycle(bucket: string) {
  const repos = useStorageRepositories();
  return useQuery({
    queryKey: STORAGES_QUERY_KEYS.lifecycle(bucket),
    enabled: Boolean(bucket),
    queryFn: async () => {
      const res = await repos.buckets.getBucketLifecycleConfiguration(bucket);
      return (res.Rules ?? []) as LifecycleRule[];
    },
  });
}

export function useSaveLifecycle() {
  const repos = useStorageRepositories();
  return useMutation({
    mutationFn: async (body: { bucket: string; rules: LifecycleRule[] }) => {
      if (!body.rules.length) return repos.buckets.deleteBucketLifecycle(body.bucket);
      return repos.buckets.putBucketLifecycleConfiguration(body.bucket, { Rules: body.rules });
    },
    onSuccess: () => invalidateEventEmitter.emit(invalidateEvents.LIFECYCLE),
  });
}

export interface ReplicationRule {
  ID?: string;
  Status?: string;
  Priority?: number;
  Filter?: { Prefix?: string };
  Destination?: { Bucket?: string };
}

export function useReplication(bucket: string) {
  const repos = useStorageRepositories();
  return useQuery({
    queryKey: STORAGES_QUERY_KEYS.replication(bucket),
    enabled: Boolean(bucket),
    queryFn: async () => {
      const res = await repos.buckets.getBucketReplication(bucket);
      return (res.ReplicationConfiguration?.Rules ?? []) as ReplicationRule[];
    },
  });
}

export function useSaveReplication() {
  const repos = useStorageRepositories();
  return useMutation({
    mutationFn: async (body: { bucket: string; rules: ReplicationRule[] }) => {
      if (!body.rules.length) return repos.buckets.deleteBucketReplication(body.bucket);
      return repos.buckets.putBucketReplication(body.bucket, { Role: "", Rules: body.rules });
    },
    onSuccess: () => invalidateEventEmitter.emit(invalidateEvents.REPLICATION),
  });
}

export function useRemoteTargets(bucket: string) {
  const repos = useStorageRepositories();
  return useQuery({
    queryKey: [...STORAGES_QUERY_KEYS.replication(bucket), "remote"] as const,
    enabled: Boolean(bucket),
    queryFn: async () => {
      const res = await repos.buckets.listRemoteReplicationTarget(bucket);
      return (Array.isArray(res) ? res : []) as Array<{ arn?: string; ARN?: string }>;
    },
  });
}

export function useSetRemoteTarget() {
  const repos = useStorageRepositories();
  return useMutation({
    mutationFn: (body: { bucket: string; arn: string }) => repos.buckets.setRemoteReplicationTarget(body.bucket, { arn: body.arn }),
    onSuccess: () => invalidateEventEmitter.emit(invalidateEvents.REPLICATION),
  });
}

export function useDeleteRemoteTarget() {
  const repos = useStorageRepositories();
  return useMutation({
    mutationFn: (body: { bucket: string; arn: string }) => repos.buckets.deleteRemoteReplicationTarget(body.bucket, body.arn),
    onSuccess: () => invalidateEventEmitter.emit(invalidateEvents.REPLICATION),
  });
}

export interface NotificationItem {
  id: string;
  type: string;
  arn: string;
  events: string[];
}

export function useBucketEvents(bucket: string) {
  const repos = useStorageRepositories();
  return useQuery({
    queryKey: STORAGES_QUERY_KEYS.events(bucket),
    enabled: Boolean(bucket),
    queryFn: async () => {
      const res = await repos.buckets.listBucketNotifications(bucket);
      const items: NotificationItem[] = [];
      const push = (
        type: string,
        configs?: Array<{ Id?: string; QueueArn?: string; TopicArn?: string; LambdaFunctionArn?: string; Events?: string[] }>,
      ) => {
        for (const cfg of configs ?? []) {
          items.push({
            id: cfg.Id ?? `${type}-${cfg.QueueArn ?? cfg.TopicArn ?? cfg.LambdaFunctionArn}`,
            type,
            arn: cfg.QueueArn ?? cfg.TopicArn ?? cfg.LambdaFunctionArn ?? "",
            events: (cfg.Events ?? []).map(String),
          });
        }
      };
      push("SQS", res.QueueConfigurations as never);
      push("SNS", res.TopicConfigurations as never);
      push("Lambda", res.LambdaFunctionConfigurations as never);
      return items;
    },
  });
}

export function useSaveBucketNotifications() {
  const repos = useStorageRepositories();
  return useMutation({
    mutationFn: (body: { bucket: string; items: NotificationItem[] }) => {
      const asConfig = (type: string, arnKey: "QueueArn" | "TopicArn" | "LambdaFunctionArn") =>
        body.items
          .filter((item) => item.type === type)
          .map((item) => ({
            Id: item.id,
            [arnKey]: item.arn,
            Events: item.events,
          }));
      return repos.buckets.putBucketNotifications(body.bucket, {
        QueueConfigurations: asConfig("SQS", "QueueArn"),
        TopicConfigurations: asConfig("SNS", "TopicArn"),
        LambdaFunctionConfigurations: asConfig("Lambda", "LambdaFunctionArn"),
      });
    },
    onSuccess: () => invalidateEventEmitter.emit(invalidateEvents.EVENTS),
  });
}

export function useSetBucketTags() {
  const repos = useStorageRepositories();
  return useMutation({
    mutationFn: (body: { bucket: string; tags: Array<{ Key: string; Value: string }> }) => {
      if (!body.tags.length) return repos.buckets.deleteBucketTagging(body.bucket);
      return repos.buckets.putBucketTagging(body.bucket, { TagSet: body.tags });
    },
    onSuccess: () => invalidateEventEmitter.emit(invalidateEvents.BUCKET_SETTINGS),
  });
}

export function useSetObjectLock() {
  const repos = useStorageRepositories();
  return useMutation({
    mutationFn: (body: { bucket: string; mode: string; days: number }) =>
      repos.buckets.putObjectLockConfiguration(body.bucket, {
        ObjectLockEnabled: "Enabled",
        Rule: { DefaultRetention: { Mode: body.mode, Days: body.days } },
      }),
    onSuccess: () => invalidateEventEmitter.emit(invalidateEvents.BUCKET_SETTINGS),
  });
}
