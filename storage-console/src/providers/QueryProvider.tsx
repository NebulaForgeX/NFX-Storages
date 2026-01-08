import type { ReactNode } from "react";

import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

import { cacheEventEmitter, cacheEvents } from "@/events/cache";

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
            // 缓存时间 10 分钟
            gcTime: 1000 * 60 * 10,
            // 失败时重试 1 次
            retry: 1,
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

  // 监听所有缓存失效事件
  useEffect(() => {
    // Category 相关
    const handleInvalidateCategories = (id?: string) => {
      queryClient.invalidateQueries({ queryKey: id ? ["categories", id] : ["categories"] });
    };
    const handleInvalidateCategory = (id: string) => {
      queryClient.invalidateQueries({ queryKey: ["category", id] });
    };

    // Subcategory 相关
    const handleInvalidateSubcategories = (id?: string) => {
      queryClient.invalidateQueries({ queryKey: id ? ["subcategories", id] : ["subcategories"] });
    };
    const handleInvalidateSubcategory = (id: string) => {
      queryClient.invalidateQueries({ queryKey: ["subcategory", id] });
    };

    // Profile 相关
    const handleInvalidateProfile = (id: string) => {
      queryClient.invalidateQueries({ queryKey: ["profile", id] });
    };
    const handleInvalidateUsers = () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    };

    // 注册监听器
    cacheEventEmitter.on(cacheEvents.INVALIDATE_CATEGORIES, handleInvalidateCategories);
    cacheEventEmitter.on(cacheEvents.INVALIDATE_CATEGORY, handleInvalidateCategory);
    cacheEventEmitter.on(cacheEvents.INVALIDATE_SUBCATEGORIES, handleInvalidateSubcategories);
    cacheEventEmitter.on(cacheEvents.INVALIDATE_SUBCATEGORY, handleInvalidateSubcategory);
    cacheEventEmitter.on(cacheEvents.INVALIDATE_PROFILE, handleInvalidateProfile);
    cacheEventEmitter.on(cacheEvents.INVALIDATE_USERS, handleInvalidateUsers);

    // 清理监听器
    return () => {
      cacheEventEmitter.off(cacheEvents.INVALIDATE_CATEGORIES, handleInvalidateCategories);
      cacheEventEmitter.off(cacheEvents.INVALIDATE_CATEGORY, handleInvalidateCategory);
      cacheEventEmitter.off(cacheEvents.INVALIDATE_SUBCATEGORIES, handleInvalidateSubcategories);
      cacheEventEmitter.off(cacheEvents.INVALIDATE_SUBCATEGORY, handleInvalidateSubcategory);
      cacheEventEmitter.off(cacheEvents.INVALIDATE_PROFILE, handleInvalidateProfile);
      cacheEventEmitter.off(cacheEvents.INVALIDATE_USERS, handleInvalidateUsers);
    };
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* 只在开发环境显示 React Query DevTools */}
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}
