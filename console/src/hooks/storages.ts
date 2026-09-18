import { useMutation, useQuery } from "@tanstack/react-query";

import { STORAGES_QUERY_KEYS } from "@/constants/storages.query.key";
import { AccessKeyStatusEnum } from "@/enums";
import { invalidateEventEmitter, invalidateEvents } from "@/events/invalidate";
import { useStorageRepositories } from "@/apis/repositories";
import { niceBytes } from "@/utils/functions";

export { useStorageRepositories } from "@/apis/repositories";

export function useUsers() {
  const repos = useStorageRepositories();
  return useQuery({
    queryKey: STORAGES_QUERY_KEYS.users,
    queryFn: async () => {
      const res = (await repos.users.listUsers()) as Record<string, Record<string, unknown>>;
      return Object.entries(res ?? {}).map(([name, info]) => ({
        accessKey: name,
        ...(typeof info === "object" && info ? info : {}),
      })) as Array<{ accessKey: string; status?: string }>;
    },
  });
}

export function useCreateUser() {
  const repos = useStorageRepositories();
  return useMutation({
    mutationFn: (body: { accessKey: string; secretKey?: string }) =>
      repos.users.createUser({ ...body, status: AccessKeyStatusEnum.ENABLED }),
    onSuccess: () => invalidateEventEmitter.emit(invalidateEvents.USERS),
  });
}

export function useDeleteUser() {
  const repos = useStorageRepositories();
  return useMutation({
    mutationFn: (name: string) => repos.users.deleteUser(name),
    onSuccess: () => invalidateEventEmitter.emit(invalidateEvents.USERS),
  });
}

export function useGroups() {
  const repos = useStorageRepositories();
  return useQuery({
    queryKey: STORAGES_QUERY_KEYS.groups,
    queryFn: async () => {
      const res = (await repos.groups.listGroup()) as Array<{ name: string; status?: string; members?: string[]; policy?: string }>;
      return res ?? [];
    },
  });
}

export function useCreateGroup() {
  const repos = useStorageRepositories();
  return useMutation({
    mutationFn: (name: string) => repos.groups.createGroup({ group: name, members: [] }),
    onSuccess: () => invalidateEventEmitter.emit(invalidateEvents.GROUPS),
  });
}

export function useDeleteGroup() {
  const repos = useStorageRepositories();
  return useMutation({
    mutationFn: (name: string) => repos.groups.removeGroup(name),
    onSuccess: () => invalidateEventEmitter.emit(invalidateEvents.GROUPS),
  });
}

export function usePolicies() {
  const repos = useStorageRepositories();
  return useQuery({
    queryKey: STORAGES_QUERY_KEYS.policies,
    queryFn: async () => {
      const res = (await repos.policies.listPolicies()) as Record<string, unknown>;
      return Object.keys(res ?? {})
        .sort((a, b) => a.localeCompare(b))
        .map((key) => ({ name: key, content: res[key] }));
    },
  });
}

export function useCreatePolicy() {
  const repos = useStorageRepositories();
  return useMutation({
    mutationFn: (body: { name: string; policy: string }) => repos.policies.addPolicy(body),
    onSuccess: () => invalidateEventEmitter.emit(invalidateEvents.POLICIES),
  });
}

export function useDeletePolicy() {
  const repos = useStorageRepositories();
  return useMutation({
    mutationFn: (name: string) => repos.policies.removePolicy(name),
    onSuccess: () => invalidateEventEmitter.emit(invalidateEvents.POLICIES),
  });
}

export function useAccessKeys() {
  const repos = useStorageRepositories();
  return useQuery({
    queryKey: STORAGES_QUERY_KEYS.accessKeys,
    queryFn: async () => {
      const res = (await repos.accessKeys.listUserServiceAccounts({})) as {
        accounts?: Array<{ accessKey: string; expiration?: string | null; name?: string; description?: string; accountStatus?: string }>;
      };
      return res.accounts ?? [];
    },
  });
}

export function useCreateAccessKey() {
  const repos = useStorageRepositories();
  return useMutation({
    mutationFn: (name: string) => repos.accessKeys.createServiceAccount({ name }),
    onSuccess: () => invalidateEventEmitter.emit(invalidateEvents.ACCESS_KEYS),
  });
}

export function useDeleteAccessKey() {
  const repos = useStorageRepositories();
  return useMutation({
    mutationFn: (accessKey: string) => repos.accessKeys.deleteServiceAccount(accessKey),
    onSuccess: () => invalidateEventEmitter.emit(invalidateEvents.ACCESS_KEYS),
  });
}

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

export function useTiers() {
  const repos = useStorageRepositories();
  return useQuery({
    queryKey: STORAGES_QUERY_KEYS.tiers,
    queryFn: async () => ((await repos.tiers.listTiers()) ?? []) as Array<{ type: string; [key: string]: unknown }>,
  });
}

export function useCreateTier() {
  const repos = useStorageRepositories();
  return useMutation({
    mutationFn: (body: { name: string; endpoint: string }) =>
      repos.tiers.addTiers({
        type: "s3",
        s3: { name: body.name, endpoint: body.endpoint, bucket: body.name, prefix: "", region: "us-east-1", accesskey: "", secretkey: "" },
      }),
    onSuccess: () => invalidateEventEmitter.emit(invalidateEvents.TIERS),
  });
}

export function useDeleteTier() {
  const repos = useStorageRepositories();
  return useMutation({
    mutationFn: (name: string) => repos.tiers.removeTiers(name),
    onSuccess: () => invalidateEventEmitter.emit(invalidateEvents.TIERS),
  });
}

export function useUpdateTier() {
  const repos = useStorageRepositories();
  return useMutation({
    mutationFn: (body: { name: string; endpoint: string }) =>
      repos.tiers.updateTiers(body.name, {
        type: "s3",
        s3: { name: body.name, endpoint: body.endpoint, bucket: body.name, prefix: "", region: "us-east-1", accesskey: "", secretkey: "" },
      }),
    onSuccess: () => invalidateEventEmitter.emit(invalidateEvents.TIERS),
  });
}

export function useEventsTarget() {
  const repos = useStorageRepositories();
  return useQuery({
    queryKey: STORAGES_QUERY_KEYS.eventsTarget,
    queryFn: async () => {
      const res = (await repos.eventsTarget.getEventsTargetList()) as {
        notification_endpoints?: Array<{ account_id: string; service: string; status: string }>;
      };
      return res.notification_endpoints ?? [];
    },
  });
}

export function useDeleteEventTarget() {
  const repos = useStorageRepositories();
  return useMutation({
    mutationFn: (row: { service: string; account_id: string }) => repos.eventsTarget.deleteEventTarget(row.service, row.account_id),
    onSuccess: () => invalidateEventEmitter.emit(invalidateEvents.EVENTS_TARGET),
  });
}

export function useLicense() {
  const repos = useStorageRepositories();
  return useQuery({
    queryKey: STORAGES_QUERY_KEYS.license,
    queryFn: () => repos.system.getLicense(),
  });
}

export function usePerformance() {
  const repos = useStorageRepositories();
  return useQuery({
    queryKey: STORAGES_QUERY_KEYS.performance,
    queryFn: async () => {
      const [info, storage, usage] = await Promise.allSettled([
        repos.system.getSystemInfo(),
        repos.system.getStorageInfo(),
        repos.system.getDataUsageInfo(),
      ]);
      return {
        info: info.status === "fulfilled" ? info.value : null,
        storage: storage.status === "fulfilled" ? storage.value : null,
        usage: usage.status === "fulfilled" ? usage.value : null,
      };
    },
  });
}

export function useKmsStatus() {
  const repos = useStorageRepositories();
  return useQuery({
    queryKey: STORAGES_QUERY_KEYS.kmsStatus,
    queryFn: () => repos.sse.getKMSStatus(),
  });
}

export function useKmsKeys() {
  const repos = useStorageRepositories();
  return useQuery({
    queryKey: STORAGES_QUERY_KEYS.kmsKeys,
    queryFn: async () => {
      const res = (await repos.sse.getKeyList({ limit: 50 })) as { keys?: Array<{ key_id?: string; KeyId?: string; description?: string }> };
      return res.keys ?? [];
    },
  });
}

export function useStartKms() {
  const repos = useStorageRepositories();
  return useMutation({
    mutationFn: () => repos.sse.startKMS(),
    onSuccess: () => invalidateEventEmitter.emit(invalidateEvents.KMS),
  });
}

export function useStopKms() {
  const repos = useStorageRepositories();
  return useMutation({
    mutationFn: () => repos.sse.stopKMS(),
    onSuccess: () => invalidateEventEmitter.emit(invalidateEvents.KMS),
  });
}

export function useChangeUserStatus() {
  const repos = useStorageRepositories();
  return useMutation({
    mutationFn: (body: { name: string; status: string }) => repos.users.changeUserStatus(body.name, { status: body.status }),
    onSuccess: () => invalidateEventEmitter.emit(invalidateEvents.USERS),
  });
}

export function useAssignUserPolicy() {
  const repos = useStorageRepositories();
  return useMutation({
    mutationFn: (body: { user: string; policyName: string }) =>
      repos.policies.setUserOrGroupPolicy({ userOrGroup: body.user, policyName: body.policyName, isGroup: "false" }),
    onSuccess: () => invalidateEventEmitter.emit(invalidateEvents.USERS),
  });
}

export function useAssignGroupPolicy() {
  const repos = useStorageRepositories();
  return useMutation({
    mutationFn: (body: { group: string; policyName: string }) =>
      repos.policies.setUserOrGroupPolicy({ userOrGroup: body.group, policyName: body.policyName, isGroup: "true" }),
    onSuccess: () => {
      invalidateEventEmitter.emit(invalidateEvents.GROUPS);
      invalidateEventEmitter.emit(invalidateEvents.POLICIES);
    },
  });
}

export function useUpdateGroupMembers() {
  const repos = useStorageRepositories();
  return useMutation({
    mutationFn: (body: { group: string; members: string[] }) => repos.groups.updateGroupMembers(body),
    onSuccess: () => invalidateEventEmitter.emit(invalidateEvents.GROUPS),
  });
}

export function useChangeGroupStatus() {
  const repos = useStorageRepositories();
  return useMutation({
    mutationFn: (body: { name: string; status: string }) => repos.groups.updateGroupStatus(body.name, { status: body.status }),
    onSuccess: () => invalidateEventEmitter.emit(invalidateEvents.GROUPS),
  });
}

export function useUpdateUserGroups() {
  const repos = useStorageRepositories();
  return useMutation({
    mutationFn: (body: { name: string; groups: string[] }) => repos.users.updateUserGroups(body.name, { groups: body.groups }),
    onSuccess: () => invalidateEventEmitter.emit(invalidateEvents.USERS),
  });
}

export function useCreateUserAccessKey() {
  const repos = useStorageRepositories();
  return useMutation({
    mutationFn: (user: string) => repos.users.createAUserServiceAccount(user, { name: user }),
    onSuccess: () => {
      invalidateEventEmitter.emit(invalidateEvents.ACCESS_KEYS);
      invalidateEventEmitter.emit(invalidateEvents.USERS);
    },
  });
}

export function useUpdateAccessKey() {
  const repos = useStorageRepositories();
  return useMutation({
    mutationFn: (body: { accessKey: string; name: string }) => repos.accessKeys.updateServiceAccount(body.accessKey, { name: body.name }),
    onSuccess: () => invalidateEventEmitter.emit(invalidateEvents.ACCESS_KEYS),
  });
}

export function useCreateEventTarget() {
  const repos = useStorageRepositories();
  return useMutation({
    mutationFn: (body: { type: string; name: string }) => repos.eventsTarget.updateEventTarget(body.type, body.name, { name: body.name }),
    onSuccess: () => invalidateEventEmitter.emit(invalidateEvents.EVENTS_TARGET),
  });
}

export function useEventTargetArns() {
  const repos = useStorageRepositories();
  return useQuery({
    queryKey: [...STORAGES_QUERY_KEYS.eventsTarget, "arns"] as const,
    queryFn: async () => ((await repos.eventsTarget.getEventTargetArnList()) ?? []) as string[],
  });
}

export function useConfigureKms() {
  const repos = useStorageRepositories();
  return useMutation({
    mutationFn: (body: unknown) => repos.sse.configureKMS(body),
    onSuccess: () => invalidateEventEmitter.emit(invalidateEvents.KMS),
  });
}

export function useCreateKmsKey() {
  const repos = useStorageRepositories();
  return useMutation({
    mutationFn: (description: string) => repos.sse.createKey({ description }),
    onSuccess: () => invalidateEventEmitter.emit(invalidateEvents.KMS),
  });
}

export function useDeleteKmsKey() {
  const repos = useStorageRepositories();
  return useMutation({
    mutationFn: (keyId: string) => repos.sse.deleteKey(keyId, true),
    onSuccess: () => invalidateEventEmitter.emit(invalidateEvents.KMS),
  });
}

export function useClearKmsCache() {
  const repos = useStorageRepositories();
  return useMutation({
    mutationFn: () => repos.sse.clearCache(),
    onSuccess: () => invalidateEventEmitter.emit(invalidateEvents.KMS),
  });
}

export function useBucketSettings(bucket: string) {
  const repos = useStorageRepositories();
  return useQuery({
    queryKey: STORAGES_QUERY_KEYS.bucketSettings(bucket),
    enabled: Boolean(bucket),
    queryFn: async () => {
      const [versioning, policy, encryption] = await Promise.allSettled([
        repos.buckets.getBucketVersioning(bucket),
        repos.buckets.getBucketPolicy(bucket),
        repos.buckets.getBucketEncryption(bucket),
      ]);
      return {
        versioning: versioning.status === "fulfilled" ? versioning.value.Status : "-",
        policy: policy.status === "fulfilled" ? (policy.value.Policy ?? "") : "",
        encryption: encryption.status === "fulfilled" ? JSON.stringify(encryption.value.ServerSideEncryptionConfiguration) : "",
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

export function useExportIam() {
  const repos = useStorageRepositories();
  return useMutation({
    mutationFn: () => repos.iamExport.exportIamConfig(),
  });
}

export function useImportIam() {
  const repos = useStorageRepositories();
  return useMutation({
    mutationFn: (file: File) => repos.iamExport.importIamConfig(file),
    onSuccess: () => {
      invalidateEventEmitter.emit(invalidateEvents.USERS);
      invalidateEventEmitter.emit(invalidateEvents.GROUPS);
      invalidateEventEmitter.emit(invalidateEvents.POLICIES);
      invalidateEventEmitter.emit(invalidateEvents.ACCESS_KEYS);
    },
  });
}

export interface ObjectRow {
  Key: string;
  type: "prefix" | "object";
  Size: number;
  LastModified: string;
}

export function useObjects(bucket: string, prefix: string, enabled: boolean) {
  const repos = useStorageRepositories();
  return useQuery({
    queryKey: STORAGES_QUERY_KEYS.objects(bucket, prefix),
    enabled: Boolean(bucket) && enabled,
    queryFn: async () => {
      const objects = repos.objects(bucket);
      const response = await objects.listObject(prefix || undefined, 100);
      const prefixes: ObjectRow[] = (response.CommonPrefixes ?? []).map((item) => ({
        Key: item.Prefix ?? "",
        type: "prefix",
        Size: 0,
        LastModified: "",
      }));
      const files: ObjectRow[] = (response.Contents ?? [])
        .filter((item) => item.Key && item.Key !== prefix)
        .map((item) => ({
          Key: item.Key ?? "",
          type: "object" as const,
          Size: item.Size ?? 0,
          LastModified: item.LastModified ? item.LastModified.toISOString() : "",
        }));
      return [...prefixes, ...files];
    },
  });
}

export function useObjectInfo(bucket: string, key: string, enabled: boolean) {
  const repos = useStorageRepositories();
  return useQuery({
    queryKey: STORAGES_QUERY_KEYS.objectInfo(bucket, key),
    enabled: Boolean(bucket) && enabled,
    queryFn: () => repos.objects(bucket).getObjectInfo(key),
  });
}

export function usePutObject() {
  const repos = useStorageRepositories();
  return useMutation({
    mutationFn: async (body: { bucket: string; key: string; file: File }) => repos.objects(body.bucket).putObject(body.key, body.file),
    onSuccess: () => invalidateEventEmitter.emit(invalidateEvents.OBJECTS),
  });
}

export function useDeleteObject() {
  const repos = useStorageRepositories();
  return useMutation({
    mutationFn: (body: { bucket: string; key: string }) => repos.objects(body.bucket).deleteObject(body.key),
    onSuccess: () => invalidateEventEmitter.emit(invalidateEvents.OBJECTS),
  });
}

export function useSignedObjectUrl() {
  const repos = useStorageRepositories();
  return useMutation({
    mutationFn: (body: { bucket: string; key: string }) => repos.objects(body.bucket).getSignedUrl(body.key),
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

export function usePutBucketNotifications() {
  const repos = useStorageRepositories();
  return useMutation({
    mutationFn: (body: { bucket: string; arn: string }) =>
      repos.buckets.putBucketNotifications(body.bucket, {
        QueueConfigurations: [{ Id: `queue-${Date.now()}`, QueueArn: body.arn, Events: ["s3:ObjectCreated:*"] }],
      }),
    onSuccess: () => invalidateEventEmitter.emit(invalidateEvents.EVENTS),
  });
}
