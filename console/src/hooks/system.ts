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
      const [info, storage, usage, metrics] = await Promise.allSettled([
        repos.system.getSystemInfo(),
        repos.system.getStorageInfo(),
        repos.system.getDataUsageInfo(),
        repos.system.getSystemMetrics(),
      ]);
      return {
        info: info.status === "fulfilled" ? (info.value as Record<string, unknown>) : null,
        storage: storage.status === "fulfilled" ? (storage.value as { disks?: Array<Record<string, unknown>> }) : null,
        usage: usage.status === "fulfilled" ? (usage.value as Record<string, unknown>) : null,
        metrics: metrics.status === "fulfilled" ? (metrics.value as Record<string, unknown>) : null,
      };
    },
  });
}

export function usePools() {
  const repos = useStorageRepositories();
  return useQuery({
    queryKey: STORAGES_QUERY_KEYS.pools,
    queryFn: async () => {
      const [list, status] = await Promise.allSettled([
        repos.pools.getPoolsList() as Promise<{ pools?: Array<{ id?: string; disks?: string[]; status?: string }> }>,
        repos.pools.getPoolsStatus() as Promise<{ pool?: string; status?: string }>,
      ]);
      const pools = list.status === "fulfilled" ? (list.value.pools ?? []) : [];
      const statusRow = status.status === "fulfilled" ? status.value : null;
      return pools.map((pool) => ({
        ...pool,
        status: pool.status ?? (statusRow && (statusRow.pool === pool.id || !pool.id) ? statusRow.status : pool.status),
      }));
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
