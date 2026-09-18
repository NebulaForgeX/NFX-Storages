import type { IdentityRepositories } from "@/identity/apis";
import type { ReactNode } from "react";

import { useEffect } from "react";
import { ApiAssetRepository, ApiAuthRepository, IdentityRepositoriesContext, setIdentityRepositories } from "@/identity/apis";
import { scheduleAccessTokenRefresh } from "@/identity/apis/authRefresh";
import { AuthStore, subscribeAuthStorageSync } from "@/identity/stores/auth";

const defaultIdentityRepositories: IdentityRepositories = {
  auth: new ApiAuthRepository(),
  asset: new ApiAssetRepository(),
};

setIdentityRepositories(defaultIdentityRepositories);

export interface DataProviderProps {
  children: ReactNode;
  repositories?: IdentityRepositories;
}

function AuthSessionBootstrap() {
  useEffect(() => {
    const accessToken = AuthStore.getState().accessToken;
    if (accessToken) scheduleAccessTokenRefresh(accessToken);
    return subscribeAuthStorageSync(() => {
      const next = AuthStore.getState().accessToken;
      if (next) scheduleAccessTokenRefresh(next);
    });
  }, []);
  return null;
}

export function DataProvider({ children, repositories }: DataProviderProps) {
  const value = repositories ?? defaultIdentityRepositories;
  setIdentityRepositories(value);
  return (
    <IdentityRepositoriesContext.Provider value={value}>
      <AuthSessionBootstrap />
      {children}
    </IdentityRepositoriesContext.Provider>
  );
}
