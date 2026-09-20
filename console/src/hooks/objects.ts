import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query";

import { STORAGES_QUERY_KEYS } from "@/constants/storages.query.key";
import { invalidateEventEmitter, invalidateEvents } from "@/events/invalidate";
import { useStorageRepositories } from "@/apis/repositories";

export interface ObjectRow {
  Key: string;
  type: "prefix" | "object";
  Size: number;
  LastModified: string;
}

export function useObjects(bucket: string, prefix: string, enabled: boolean) {
  const repos = useStorageRepositories();
  return useInfiniteQuery({
    queryKey: STORAGES_QUERY_KEYS.objects(bucket, prefix),
    enabled: Boolean(bucket) && enabled,
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) => {
      const objects = repos.objects(bucket);
      const response = await objects.listObject(prefix || undefined, 100, pageParam);
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
      return {
        rows: [...prefixes, ...files],
        nextToken: response.NextContinuationToken,
        isTruncated: Boolean(response.IsTruncated && response.NextContinuationToken),
      };
    },
    getNextPageParam: (last) => (last.isTruncated ? last.nextToken : undefined),
  });
}

export function useObjectInfo(bucket: string, key: string, enabled: boolean) {
  const repos = useStorageRepositories();
  return useQuery({
    queryKey: STORAGES_QUERY_KEYS.objectInfo(bucket, key),
    enabled: Boolean(bucket) && Boolean(key) && enabled,
    queryFn: () => repos.objects(bucket).getObjectInfo(key),
  });
}

export function useObjectTags(bucket: string, key: string, enabled: boolean) {
  const repos = useStorageRepositories();
  return useQuery({
    queryKey: STORAGES_QUERY_KEYS.objectTags(bucket, key),
    enabled: Boolean(bucket) && Boolean(key) && enabled,
    queryFn: () => repos.objects(bucket).getObjectTags(key),
  });
}

export function useObjectVersions(bucket: string, key: string, enabled: boolean) {
  const repos = useStorageRepositories();
  return useQuery({
    queryKey: STORAGES_QUERY_KEYS.objectVersions(bucket, key),
    enabled: Boolean(bucket) && Boolean(key) && enabled,
    queryFn: () => repos.objects(bucket).listObjectVersions(key),
  });
}

export function useObjectRetention(bucket: string, key: string, enabled: boolean) {
  const repos = useStorageRepositories();
  return useQuery({
    queryKey: STORAGES_QUERY_KEYS.objectRetention(bucket, key),
    enabled: Boolean(bucket) && Boolean(key) && enabled,
    queryFn: async () => {
      try {
        return await repos.objects(bucket).getObjectRetention(key);
      } catch {
        return null;
      }
    },
  });
}

export function useObjectLegalHold(bucket: string, key: string, enabled: boolean) {
  const repos = useStorageRepositories();
  return useQuery({
    queryKey: STORAGES_QUERY_KEYS.objectLegalHold(bucket, key),
    enabled: Boolean(bucket) && Boolean(key) && enabled,
    queryFn: async () => {
      try {
        return await repos.objects(bucket).getObjectLegalHold(key);
      } catch {
        return null;
      }
    },
  });
}

export function usePutObject() {
  const repos = useStorageRepositories();
  return useMutation({
    mutationFn: async (body: { bucket: string; key: string; file: Blob | File | string }) =>
      repos.objects(body.bucket).putObject(body.key, body.file),
    onSuccess: () => invalidateEventEmitter.emit(invalidateEvents.OBJECTS),
  });
}

export function useCreateFolder() {
  const repos = useStorageRepositories();
  return useMutation({
    mutationFn: (body: { bucket: string; key: string }) => repos.objects(body.bucket).createFolder(body.key),
    onSuccess: () => invalidateEventEmitter.emit(invalidateEvents.OBJECTS),
  });
}

export function useDeleteObject() {
  const repos = useStorageRepositories();
  return useMutation({
    mutationFn: (body: { bucket: string; key: string; versionId?: string }) =>
      repos.objects(body.bucket).deleteObject(body.key, body.versionId),
    onSuccess: () => invalidateEventEmitter.emit(invalidateEvents.OBJECTS),
  });
}

export function useDeleteAllObjectVersions() {
  const repos = useStorageRepositories();
  return useMutation({
    mutationFn: (body: { bucket: string; key: string }) => repos.objects(body.bucket).deleteAllVersions(body.key),
    onSuccess: () => invalidateEventEmitter.emit(invalidateEvents.OBJECTS),
  });
}

export function useSignedObjectUrl() {
  const repos = useStorageRepositories();
  return useMutation({
    mutationFn: (body: { bucket: string; key: string }) => repos.objects(body.bucket).getSignedUrl(body.key),
  });
}

export function useSaveObjectTags() {
  const repos = useStorageRepositories();
  return useMutation({
    mutationFn: (body: { bucket: string; key: string; tags: Array<{ Key: string; Value: string }> }) => {
      if (!body.tags.length) return repos.objects(body.bucket).deleteObjectTags(body.key);
      return repos.objects(body.bucket).putObjectTags(body.key, body.tags);
    },
    onSuccess: () => invalidateEventEmitter.emit(invalidateEvents.OBJECTS),
  });
}

export function useSaveObjectRetention() {
  const repos = useStorageRepositories();
  return useMutation({
    mutationFn: (body: { bucket: string; key: string; mode: "GOVERNANCE" | "COMPLIANCE"; retainUntilDate?: string }) =>
      repos.objects(body.bucket).putObjectRetention(body.key, { Mode: body.mode, RetainUntilDate: body.retainUntilDate }),
    onSuccess: () => invalidateEventEmitter.emit(invalidateEvents.OBJECTS),
  });
}

export function useSaveObjectLegalHold() {
  const repos = useStorageRepositories();
  return useMutation({
    mutationFn: (body: { bucket: string; key: string; status: "ON" | "OFF" }) =>
      repos.objects(body.bucket).putObjectLegalHold(body.key, { Status: body.status }),
    onSuccess: () => invalidateEventEmitter.emit(invalidateEvents.OBJECTS),
  });
}
