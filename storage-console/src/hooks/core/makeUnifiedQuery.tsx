import type {
  QueryKey,
  UseQueryOptions,
  UseQueryResult,
  UseSuspenseQueryOptions,
  UseSuspenseQueryResult,
} from "@tanstack/react-query";
import type { AxiosError } from "axios";

import { useMemo } from "react";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";

type QueryMode = "normal" | "suspense";

// ------------------ Overload Signatures ------------------
export function makeUnifiedQuery<T, F extends object = Record<string, unknown>>(
  fetchRemote: (params: F) => Promise<T>,
  mode: "suspense",
  postProcess?: (data: T) => void,
): (
  queryKey: QueryKey,
  filter?: F,
  options?: Omit<UseSuspenseQueryOptions<T, AxiosError, T>, "queryKey" | "queryFn">,
) => UseSuspenseQueryResult<T, AxiosError>;

export function makeUnifiedQuery<T, F extends object = Record<string, unknown>>(
  fetchRemote: (params: F) => Promise<T>,
  mode?: "normal",
  postProcess?: (data: T) => void,
): (
  queryKey: QueryKey,
  filter?: F,
  options?: Omit<UseQueryOptions<T, AxiosError, T>, "queryKey" | "queryFn">,
) => UseQueryResult<T, AxiosError>;

// ------------------ Implementation ------------------
export function makeUnifiedQuery<T, F extends object = Record<string, unknown>>(
  fetchRemote: (params: F) => Promise<T>,
  mode: QueryMode = "normal",
  postProcess?: (data: T) => void,
) {
  type QueryOptions = Omit<UseQueryOptions<T, AxiosError, T>, "queryKey" | "queryFn">;
  type SuspenseQueryOptions = Omit<UseSuspenseQueryOptions<T, AxiosError, T>, "queryKey" | "queryFn">;

  const fetchFunction = async (filter: F): Promise<T> => {
    const data = await fetchRemote(filter);
    postProcess?.(data);
    return data;
  };

  const buildCommonOptions = (queryKey: QueryKey, filter?: F, options?: QueryOptions | SuspenseQueryOptions) => {
    return {
      queryKey: filter !== undefined ? [...queryKey, filter] : queryKey,
      queryFn: () => fetchFunction(filter || ({} as F)),
      select: (data: T) => data,
      retry: (failureCount: number, error: AxiosError) => {
        const status = error?.status ?? error?.response?.status;
        const transient = (typeof status === "number" && status >= 500) || error?.code === "NETWORK_ERROR";
        const retryMax = typeof options?.retry === "number" ? options.retry : 3;
        return transient && failureCount < retryMax;
      },
      ...(options as object),
    };
  };

  // Normal Query
  function useQueryNormal(queryKey: QueryKey, filter?: F, options?: QueryOptions): UseQueryResult<T, AxiosError> {
    const common = useMemo(() => buildCommonOptions(queryKey, filter, options), [queryKey, filter, options]);
    return useQuery(common);
  }

  // Suspense Query
  function useQuerySuspense(
    queryKey: QueryKey,
    filter?: F,
    options?: SuspenseQueryOptions,
  ): UseSuspenseQueryResult<T, AxiosError> {
    const common = useMemo(() => buildCommonOptions(queryKey, filter, options), [queryKey, filter, options]);
    return useSuspenseQuery(common);
  }

  if (mode === "suspense") {
    return (queryKey: QueryKey, filter?: F, options?: SuspenseQueryOptions) =>
      useQuerySuspense(queryKey, filter, options);
  }
  return (queryKey: QueryKey, filter?: F, options?: QueryOptions) => useQueryNormal(queryKey, filter, options);
}
