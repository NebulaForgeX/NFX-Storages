import { useMutation, useQuery } from "@tanstack/react-query";

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
