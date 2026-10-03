import type { InternalAxiosRequestConfig } from "axios";

import axios, { AxiosError } from "axios";
import { refreshAuthTokens } from "nfx-ui/apis";
import { authEventEmitter, authEvents } from "nfx-ui/events";
import { AuthStore, clearAuth, hasSelectedProfile } from "nfx-ui/stores";
import type { ApiErrorBody } from "nfx-ui/types";
import { shouldForceLogoutAfterAuthRetry, shouldImmediateForceLogoutOnApiError } from "nfx-ui/utils";

import { API_ENDPOINTS } from "@/apis/ip";

declare module "axios" {
  export interface AxiosRequestConfig {
    _retry?: boolean;
  }
}

export const protectedClient = axios.create({
  baseURL: API_ENDPOINTS.PURE,
  timeout: 15000,
});

export const publicClient = axios.create({
  baseURL: API_ENDPOINTS.PURE,
  timeout: 15000,
});

protectedClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const accessToken = AuthStore.getState().accessToken;
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

function logApiError(error: AxiosError<ApiErrorBody>): void {
  const errorData = error.response?.data;
  if (errorData?.message) {
    console.log("❌ API Error:", {
      message: errorData.message,
      errCode: errorData.errCode ?? (errorData as { err_code?: string }).err_code,
      status: error.response?.status ?? errorData.status,
      url: error.config?.url,
    });
  }
}

protectedClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!(error instanceof AxiosError)) {
      return Promise.reject(error);
    }
    logApiError(error);

    const emitLogout = () => {
      if (!AuthStore.getState().isAuthValid) return;
      if (!hasSelectedProfile(AuthStore.getState().currentProfileId)) return;
      const aID = AuthStore.getState().currentAccountId;
      authEventEmitter.emit(authEvents.LOGOUT, aID ?? undefined);
      clearAuth();
    };

    if (shouldImmediateForceLogoutOnApiError(error)) {
      emitLogout();
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && error.config && !error.config._retry) {
      error.config._retry = true;
      try {
        const refreshed = await refreshAuthTokens("401");
        if (!refreshed) {
          emitLogout();
          return Promise.reject(error);
        }
        return protectedClient.request(error.config);
      } catch {
        emitLogout();
        return Promise.reject(error);
      }
    }

    if (shouldForceLogoutAfterAuthRetry(error)) {
      emitLogout();
    }

    return Promise.reject(error);
  },
);

publicClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (error instanceof AxiosError) {
      logApiError(error);
    }
    return Promise.reject(error);
  },
);
