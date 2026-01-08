import { useEffect, useState } from "react";

import { CheckLogin } from "@/apis/auth.api";
import AuthStore from "@/stores/authStore";

/**
 * 应用启动时验证 token 的有效性
 * 如果 localStorage 中有 token 但后端验证失败，将 isAuthValid 设置为 false
 */
export const useAuthInit = () => {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const verifyAuth = async () => {
      // 直接从 store 读取当前状态（persist 是同步恢复的）
      const { accessToken, isAuthValid } = AuthStore.getState();

      // 如果 localStorage 中有 token 且 isAuthValid 为 true，验证 token 有效性
      if (accessToken && isAuthValid) {
        try {
          await CheckLogin();
          // 验证成功，保持 isAuthValid = true
        } catch (error) {
          // 验证失败（401 或其他错误），清除认证信息
          console.warn("Token validation failed on app init, clearing auth:", error);
          AuthStore.getState().clearAuth();
        }
      } else if (!accessToken) {
        // 没有 token，确保 isAuthValid 为 false
        if (isAuthValid) {
          AuthStore.getState().clearAuth();
        }
      }
      setIsInitialized(true);
    };

    verifyAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 空依赖数组，只在组件挂载时执行一次

  return { isInitialized };
};

