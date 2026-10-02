import { useMutation, useQuery } from "@tanstack/react-query";

import { STORAGES_QUERY_KEYS } from "@/constants/storages.query.key";
import { invalidateEventEmitter, invalidateEvents } from "@/events/invalidate";
import { useStorageRepositories } from "@/apis/repositories";

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
      const res = (await repos.sse.getKeyList({ limit: 50 })) as {
        keys?: Array<{ key_id?: string; KeyId?: string; description?: string; status?: string }>;
      };
      return res.keys ?? [];
    },
  });
}

export function useKmsKeyDetails(keyId: string) {
  const repos = useStorageRepositories();
  return useQuery({
    queryKey: [...STORAGES_QUERY_KEYS.kmsKeys, keyId] as const,
    enabled: Boolean(keyId),
    queryFn: () => repos.sse.getKeyDetails(keyId) as Promise<Record<string, unknown>>,
  });
}

export function useKmsConfig() {
  const repos = useStorageRepositories();
  return useQuery({
    queryKey: [...STORAGES_QUERY_KEYS.kmsStatus, "config"] as const,
    queryFn: () => repos.sse.getConfiguration() as Promise<Record<string, unknown>>,
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
    mutationFn: (keyId: string) => repos.sse.deleteKey(keyId, false),
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

export function useCancelKmsKeyDeletion() {
  const repos = useStorageRepositories();
  return useMutation({
    mutationFn: (keyId: string) => repos.sse.cancelKeyDeletion(keyId),
    onSuccess: () => invalidateEventEmitter.emit(invalidateEvents.KMS),
  });
}

export function useGenerateKmsDataKey() {
  const repos = useStorageRepositories();
  return useMutation({
    mutationFn: (keyId: string) => repos.sse.generateDataKey({ key_id: keyId }),
    onSuccess: () => invalidateEventEmitter.emit(invalidateEvents.KMS),
  });
}
