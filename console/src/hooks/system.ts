import { useMutation, useQuery } from "@tanstack/react-query";

import { STORAGES_QUERY_KEYS } from "@/constants/storages.query.key";
import { invalidateEventEmitter, invalidateEvents } from "@/events/invalidate";
import { useStorageRepositories } from "@/apis/repositories";

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

export function usePools() {
  const repos = useStorageRepositories();
  return useQuery({
    queryKey: STORAGES_QUERY_KEYS.pools,
    queryFn: async () => {
      const res = (await repos.pools.getPoolsList()) as { pools?: Array<{ id?: string; disks?: string[]; status?: string }> };
      return res.pools ?? [];
    },
  });
}

export function useDecommissionPool() {
  const repos = useStorageRepositories();
  return useMutation({
    mutationFn: (pool: string) => repos.pools.offlinePool(pool),
    onSuccess: () => invalidateEventEmitter.emit(invalidateEvents.POOLS),
  });
}

export function useCancelPoolDecommission() {
  const repos = useStorageRepositories();
  return useMutation({
    mutationFn: (pool: string) => repos.pools.cancelOfflinePool(pool),
    onSuccess: () => invalidateEventEmitter.emit(invalidateEvents.POOLS),
  });
}
