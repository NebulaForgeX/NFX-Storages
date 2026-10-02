import type { ReactNode } from "react";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

import { useAuthInv } from "./hooks/useAuthInv";
import { useQueryInv } from "./hooks/useQueryInv";

interface QueryProviderProps {
  children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  // Create a client with default options
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // 数据在 10 分钟内被认为是新鲜的
            staleTime: 1000 * 60 * 10,
            gcTime: 1000 * 60 * 10,
            retry: 3,
            // 窗口重新获得焦点时不重新获取
            refetchOnWindowFocus: false,
            // 网络重新连接时不重新获取
            refetchOnReconnect: false,
          },
          mutations: {
            // 失败时重试 1 次
            retry: 1,
          },
        },
      }),
  );

  useAuthInv(queryClient);
  useQueryInv(queryClient);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* 只在开发环境显示 React Query DevTools */}
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}

export default QueryProvider;
