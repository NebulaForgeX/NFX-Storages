import { ApiAuthRepository } from "nfx-ui/apis";
import { AuthStore as IdentityAuthStore } from "nfx-ui/stores";

import { URL_PATHS } from "@/apis/ip";
import { protectedClient } from "@/apis/httpClients";
import { AuthStore } from "@/stores/authStore";
import type { SessionCredentials } from "@/stores/authStore";
import { getStoragesApiErrorMessage } from "@/utils/error-handler";

export const authRepository = {
  async issueSessionCredentials() {
    try {
      const { data } = await protectedClient.post<SessionCredentials>(URL_PATHS.ADMIN.sessionCredentials);
      AuthStore.getState().setCredentials({
        AccessKeyId: data.AccessKeyId,
        SecretAccessKey: data.SecretAccessKey,
        SessionToken: data.SessionToken,
        Expiration: data.Expiration,
      });
      return data;
    } catch (err) {
      throw new Error(getStoragesApiErrorMessage(err, "request failed"));
    }
  },

  async logout() {
    const refreshToken = IdentityAuthStore.getState().refreshToken;
    if (refreshToken) {
      try {
        await new ApiAuthRepository().Logout({ refreshToken });
      } catch {
        // Local session must still be cleared if revoke fails.
      }
    }
    AuthStore.getState().clearAuth();
    IdentityAuthStore.getState().clearAuth();
  },
};
