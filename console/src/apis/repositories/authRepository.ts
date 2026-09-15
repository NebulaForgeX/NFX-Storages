import type { AwsCredentialIdentity, AwsCredentialIdentityProvider } from "@aws-sdk/types";

import { getStsToken } from "@/lib/sts";
import { AuthStore } from "@/stores/authStore";
import { configManager } from "@/utils/config";
import type { SiteConfig } from "@/types/config";

export const authRepository = {
  async login(credentials: AwsCredentialIdentity | AwsCredentialIdentityProvider, customConfig?: SiteConfig) {
    const siteConfig = customConfig ?? (await configManager.loadConfig());
    const credentialsResponse = await getStsToken(credentials, "arn:aws:iam::*:role/Admin", siteConfig);
    AuthStore.getState().setCredentials({
      AccessKeyId: credentialsResponse.AccessKeyId,
      SecretAccessKey: credentialsResponse.SecretAccessKey,
      SessionToken: credentialsResponse.SessionToken,
      Expiration: credentialsResponse.Expiration?.toISOString(),
    });
    return credentialsResponse;
  },

  logout() {
    AuthStore.getState().clearAuth();
  },
};
