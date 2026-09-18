import { useCallback, useEffect } from "react";
import { useNavigate } from "react-router";

import { authRepository } from "@/apis/repositories";
import { authEventEmitter, authEvents } from "@/events/auth";
import { routerEventEmitter, routerEvents } from "@/events/router";
import { ROUTES } from "@/navigations";

export function useRouterEvents() {
  const navigate = useNavigate();

  const handleNavigate = useCallback(
    (payload: { to: string; replace?: boolean; state?: unknown }) => {
      navigate(payload.to, { replace: payload.replace, state: payload.state });
    },
    [navigate],
  );

  const goLogin = useCallback(() => {
    void authRepository.logout().finally(() => {
      navigate(ROUTES.LOGIN, { replace: true });
    });
  }, [navigate]);

  const handleLoginSuccess = useCallback(() => {
    navigate(ROUTES.SELECT_PROFILE, { replace: true });
  }, [navigate]);

  useEffect(() => {
    routerEventEmitter.on(routerEvents.NAVIGATE, handleNavigate as (...args: unknown[]) => void);
    routerEventEmitter.on(routerEvents.NAVIGATE_TO_LOGIN, goLogin);
    routerEventEmitter.on(routerEvents.NAVIGATE_TO_DASHBOARD, () => navigate(ROUTES.BROWSER, { replace: true }));
    authEventEmitter.on(authEvents.LOGIN_SUCCESS, handleLoginSuccess);
    authEventEmitter.on(authEvents.LOGOUT, goLogin);
    return () => {
      routerEventEmitter.off(routerEvents.NAVIGATE, handleNavigate as (...args: unknown[]) => void);
      routerEventEmitter.off(routerEvents.NAVIGATE_TO_LOGIN, goLogin);
      authEventEmitter.off(authEvents.LOGIN_SUCCESS, handleLoginSuccess);
      authEventEmitter.off(authEvents.LOGOUT, goLogin);
    };
  }, [handleNavigate, goLogin, handleLoginSuccess, navigate]);
}
