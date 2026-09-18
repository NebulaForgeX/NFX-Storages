/**
 * Axios instances + interceptors for Identity HTTP.
 * publicClient: login / refresh. protectedClient: Bearer + 401 → refreshAuthTokens.
 */
import type { InternalAxiosRequestConfig } from "axios";
import type { ApiErrorBody } from "nfx-ui/types";

import axios, { AxiosError } from "axios";
import applyCaseMiddleware from "axios-case-converter";
import { authEventEmitter, authEvents } from "@/identity/events/auth";
import { AuthStore, clearAuth, hasSelectedProfile } from "@/identity/stores/auth";
import { shouldForceLogoutAfterAuthRetry, shouldImmediateForceLogoutOnApiError } from "@/identity/utils/sessionErrors";
import { safeOr } from "nfx-ui/utils";

import { refreshAuthTokens } from "./authRefresh";
import { API_ENDPOINTS } from "@/identity/apis/ip";

export const protectedClient = applyCaseMiddleware(
  axios.create({
    baseURL: API_ENDPOINTS.IDENTITY,
    timeout: 8000,
  }),
);

export const publicClient = applyCaseMiddleware(
  axios.create({
    baseURL: API_ENDPOINTS.IDENTITY,
    timeout: 8000,
  }),
);

export const publicClientWithoutTransform = axios.create({
  baseURL: API_ENDPOINTS.IDENTITY,
  timeout: 8000,
});

declare module "axios" {
  export interface AxiosRequestConfig {
    _retry?: boolean;
  }
}

protectedClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const accessToken = AuthStore.getState().accessToken;
    if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
    return config;
  },
  (error) => Promise.reject(error),
);

function logApiError(error: AxiosError<ApiErrorBody>): void {
  const errorData = error.response?.data;
  const msg = errorData?.message;
  if (msg) {
    console.log("❌ API Error:", {
      message: msg,
      errCode: errorData?.errCode,
      status: safeOr(error.response?.status, errorData?.status),
      url: error.config?.url,
      method: error.config?.method,
    });
  } else if (import.meta.env.DEV && error.response?.status) {
    console.log("❌ HTTP Error:", {
      status: error.response.status,
      url: error.config?.url,
      method: error.config?.method,
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
    if (error instanceof AxiosError) logApiError(error as AxiosError<ApiErrorBody>);
    return Promise.reject(error);
  },
);
