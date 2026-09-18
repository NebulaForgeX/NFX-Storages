import { useEffect } from "react";
import type { QueryClient } from "@tanstack/react-query";
import { authEventEmitter } from "nfx-ui/events";
import { AuthStore } from "nfx-ui/stores";

export const useQueryInv = (queryClient: QueryClient) => {
  useEffect(() => {
    const handleLogout = () => {
      AuthStore.getState().clearAuth();
      queryClient.clear();
    };
    authEventEmitter.onLogout(handleLogout);
    return () => {
      authEventEmitter.offLogout(handleLogout);
    };
  }, [queryClient]);
};
