import { useEffect } from "react";
import { QueryClient } from "@tanstack/react-query";
import { queryEventEmitter, queryEvents } from "nfx-ui/events";

export const useQueryInv = (queryClient: QueryClient) => {
  useEffect(() => {
    const onResetActive = (onDone?: () => void) => {
      void queryClient.resetQueries({ type: "active" }).then(() => {
        onDone?.();
      });
    };

    queryEventEmitter.on(queryEvents.RESET_ACTIVE_QUERIES, onResetActive);

    return () => {
      queryEventEmitter.off(queryEvents.RESET_ACTIVE_QUERIES, onResetActive);
    };
  }, [queryClient]);
};
