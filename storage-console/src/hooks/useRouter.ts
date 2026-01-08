import { useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import { authEventEmitter, authEvents } from "@/events/auth";
import { ROUTES } from "@/types/navigation";

/**
 * 路由相关的 hooks，统一管理路由跳转逻辑
 * 未来可以扩展更多路由相关的 useEffect
 */
export const useRouter = () => {
  const navigate = useNavigate();
  const handleLoginSuccess = useCallback(() => {
    navigate(ROUTES.DASHBOARD, { replace: true });
  }, [navigate]);

  // 监听登录/注册成功事件，统一处理跳转
  useEffect(() => {
    authEventEmitter.on(authEvents.LOGIN_SUCCESS, handleLoginSuccess);
    return () => {
      // Cleanup: 移除监听器
      authEventEmitter.off(authEvents.LOGIN_SUCCESS, handleLoginSuccess);
    };
  }, [handleLoginSuccess]);

  // 未来可以添加更多路由相关的 useEffect
  // 例如：
  // - 监听登出事件，跳转到登录页
  // - 监听权限变化，重定向到相应页面
  // - 监听路由变化，记录访问历史等
};

