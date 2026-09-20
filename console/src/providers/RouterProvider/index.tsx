import type { ReactNode } from "react";

import { useCallback, useEffect } from "react";
import { BrowserRouter, useNavigate } from "react-router";

import { routerEventEmitter, routerEvents } from "@/events/router";
import { ROUTES } from "@/navigations";

export interface RouterProviderProps {
  children: ReactNode;
}

function RouterEventsHandler({ children }: { children: ReactNode }) {
  const navigate = useNavigate();

  const handleNavigate = useCallback(
    (payload: { to: string; replace?: boolean; state?: unknown }) => {
      navigate(payload.to, { replace: payload.replace, state: payload.state });
    },
    [navigate],
  );

  const handleNavigateBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const handleNavigateToLogin = useCallback(() => {
    navigate(ROUTES.LOGIN, { replace: true });
  }, [navigate]);

  const handleNavigateToDashboard = useCallback(() => {
    navigate(ROUTES.BROWSER, { replace: true });
  }, [navigate]);

  useEffect(() => {
    routerEventEmitter.on(routerEvents.NAVIGATE, handleNavigate);
    routerEventEmitter.on(routerEvents.NAVIGATE_BACK, handleNavigateBack);
    routerEventEmitter.on(routerEvents.NAVIGATE_TO_LOGIN, handleNavigateToLogin);
    routerEventEmitter.on(routerEvents.NAVIGATE_TO_DASHBOARD, handleNavigateToDashboard);
    return () => {
      routerEventEmitter.off(routerEvents.NAVIGATE, handleNavigate);
      routerEventEmitter.off(routerEvents.NAVIGATE_BACK, handleNavigateBack);
      routerEventEmitter.off(routerEvents.NAVIGATE_TO_LOGIN, handleNavigateToLogin);
      routerEventEmitter.off(routerEvents.NAVIGATE_TO_DASHBOARD, handleNavigateToDashboard);
    };
  }, [handleNavigate, handleNavigateBack, handleNavigateToDashboard, handleNavigateToLogin]);

  return <>{children}</>;
}

function RouterProvider({ children }: RouterProviderProps) {
  return (
    <BrowserRouter>
      <RouterEventsHandler>{children}</RouterEventsHandler>
    </BrowserRouter>
  );
}

export default RouterProvider;
