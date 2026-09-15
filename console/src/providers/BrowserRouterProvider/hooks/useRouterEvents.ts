import { useCallback, useEffect } from "react";
import { useNavigate } from "react-router";

import { authEventEmitter, authEvents } from "@/events/auth";
import { routerEventEmitter, routerEvents } from "@/events/router";
import { ROUTES } from "@/navigations";
import { AuthStore } from "@/stores/authStore";

export function useRouterEvents() {
  const navigate = useNavigate();

  const handleNavigate = useCallback(
    (payload: { to: string; replace?: boolean; state?: unknown }) => {
      navigate(payload.to, { replace: payload.replace, state: payload.state });
    },
    [navigate],
  );

  const handleNavigateReplace = useCallback(
    (payload: { to: string; state?: unknown }) => {
      navigate(payload.to, { replace: true, state: payload.state });
    },
    [navigate],
  );

  const handleNavigateToLogin = useCallback(() => {
    AuthStore.getState().clearAuth();
    navigate(ROUTES.LOGIN, { replace: true });
  }, [navigate]);

  const handleNavigateToDashboard = useCallback(() => {
    navigate(ROUTES.BROWSER, { replace: true });
  }, [navigate]);

  const handleLoginSuccess = useCallback(() => {
    navigate(ROUTES.BROWSER, { replace: true });
  }, [navigate]);

  const handleLogout = useCallback(() => {
    AuthStore.getState().clearAuth();
    navigate(ROUTES.LOGIN, { replace: true });
  }, [navigate]);

  useEffect(() => {
    routerEventEmitter.on(routerEvents.NAVIGATE, handleNavigate as (...args: unknown[]) => void);
    routerEventEmitter.on(routerEvents.NAVIGATE_REPLACE, handleNavigateReplace as (...args: unknown[]) => void);
    routerEventEmitter.on(routerEvents.NAVIGATE_TO_LOGIN, handleNavigateToLogin);
    routerEventEmitter.on(routerEvents.NAVIGATE_TO_DASHBOARD, handleNavigateToDashboard);
    authEventEmitter.on(authEvents.LOGIN_SUCCESS, handleLoginSuccess as (...args: unknown[]) => void);
    authEventEmitter.on(authEvents.LOGOUT, handleLogout);

    return () => {
      routerEventEmitter.off(routerEvents.NAVIGATE, handleNavigate as (...args: unknown[]) => void);
      routerEventEmitter.off(routerEvents.NAVIGATE_REPLACE, handleNavigateReplace as (...args: unknown[]) => void);
      routerEventEmitter.off(routerEvents.NAVIGATE_TO_LOGIN, handleNavigateToLogin);
      routerEventEmitter.off(routerEvents.NAVIGATE_TO_DASHBOARD, handleNavigateToDashboard);
      authEventEmitter.off(authEvents.LOGIN_SUCCESS, handleLoginSuccess as (...args: unknown[]) => void);
      authEventEmitter.off(authEvents.LOGOUT, handleLogout);
    };
  }, [handleNavigate, handleNavigateReplace, handleNavigateToLogin, handleNavigateToDashboard, handleLoginSuccess, handleLogout]);
}
