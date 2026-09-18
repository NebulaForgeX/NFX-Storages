import { useEffect } from "react";
import { QueryClient } from "@tanstack/react-query";
import { ACCOUNT_SCOPE, AUTH_ACCOUNT_SCOPE, AUTH_EMAILS, AUTH_ME, AUTH_PROFILE_SCOPE, AUTH_PROFILES } from "nfx-ui/constants";
import { authEventEmitter, authEvents, InvalidateProfilesPayload } from "nfx-ui/events";
import { AuthStore } from "nfx-ui/stores";

import { safeNullable, safeOr } from "@/utils";

export const useAuthInv = (queryClient: QueryClient) => {
  useEffect(() => {
    const resolveAccountId = (id?: string) => safeNullable(safeOr(id, AuthStore.getState().currentAccountId));

    const onLogout = (aID?: string) => {
      const id = resolveAccountId(aID);
      if (!id) return;
      queryClient.getMutationCache().clear();
      queryClient.removeQueries({ queryKey: ACCOUNT_SCOPE(id) });
    };

    const onUpdateAccount = (aID?: string) => {
      const id = resolveAccountId(aID);
      if (!id) return;
      const pID = AuthStore.getState().currentProfileId;
      queryClient.invalidateQueries({
        queryKey: AUTH_ACCOUNT_SCOPE(id),
        refetchType: "active",
      });
      if (pID) {
        queryClient.invalidateQueries({
          queryKey: AUTH_PROFILE_SCOPE(id, pID),
          refetchType: "active",
        });
      }
    };

    const onInvalidateEmails = (aID?: string) => {
      const id = resolveAccountId(aID);
      if (!id) return;
      queryClient.invalidateQueries({
        queryKey: ACCOUNT_SCOPE(id),
        refetchType: "active",
      });
      queryClient.invalidateQueries({
        queryKey: AUTH_EMAILS(id),
        refetchType: "all",
      });
      const pID = AuthStore.getState().currentProfileId;
      if (pID) {
        queryClient.invalidateQueries({
          queryKey: AUTH_ME(id, pID),
          refetchType: "all",
        });
        queryClient.invalidateQueries({
          queryKey: AUTH_PROFILE_SCOPE(id, pID),
          refetchType: "all",
        });
      }
    };

    const onInvalidateProfiles = (payload: InvalidateProfilesPayload) => {
      if (!payload?.aID || !payload?.kind) return;
      queryClient.invalidateQueries({
        queryKey: AUTH_PROFILES(payload.aID, payload.kind),
        refetchType: "active",
      });
    };

    authEventEmitter.on(authEvents.LOGOUT, onLogout);
    authEventEmitter.on(authEvents.UPDATE_ACCOUNT_SUCCESS, onUpdateAccount);
    authEventEmitter.on(authEvents.INVALIDATE_EMAILS, onInvalidateEmails);
    authEventEmitter.on(authEvents.INVALIDATE_PROFILES, onInvalidateProfiles);

    return () => {
      authEventEmitter.off(authEvents.LOGOUT, onLogout);
      authEventEmitter.off(authEvents.UPDATE_ACCOUNT_SUCCESS, onUpdateAccount);
      authEventEmitter.off(authEvents.INVALIDATE_EMAILS, onInvalidateEmails);
      authEventEmitter.off(authEvents.INVALIDATE_PROFILES, onInvalidateProfiles);
    };
  }, [queryClient]);
};
