// api/clients.ts
import type { AxiosRequestTransformer, InternalAxiosRequestConfig } from "axios";

import axios, { AxiosError } from "axios";
import applyCaseMiddleware from "axios-case-converter";

import { API_ENDPOINTS } from "@/apis/types";
import AuthStore from "@/stores/authStore";
import { onceAsync } from "@/utils/promise";

// 让 config._retry 有类型
declare module "axios" {
  export interface AxiosRequestConfig {
    _retry?: boolean;
  }
}

// 1) 先创建实例并套 case 中间件
export const protectedClient = applyCaseMiddleware(
  axios.create({
    baseURL: API_ENDPOINTS.PURE,
    timeout: 8000,
  }),
);

export const publicClient = applyCaseMiddleware(
  axios.create({
    baseURL: API_ENDPOINTS.PURE,
    timeout: 8000,
  }),
);

// 2) 请求拦截器：加 token（这里看到的是转换前的 camelCase）
protectedClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const accessToken = AuthStore.getState().accessToken;
    if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
    // 这里的 data/params 还是 camelCase（转换尚未发生）
    // console.log("🧩 Before transform (camelCase) - data:", config.data);
    // console.log("🧩 Before transform (camelCase) - params:", config.params);
    return config;
  },
  (error) => Promise.reject(error),
);

// 3) 在 transformRequest 队列“末尾”追加一个调试 transformer
//    这里的 data 一定已经被 axios-case-converter 转成 snake_case 了
function asArray<T>(v: T | T[] | undefined): T[] {
  return v ? (Array.isArray(v) ? v : [v]) : [];
}

protectedClient.defaults.transformRequest = [
  ...asArray<AxiosRequestTransformer>(protectedClient.defaults.transformRequest),
  (data: unknown, _headers) => {
    let out: unknown = data;
    try {
      if (typeof out === "string") out = JSON.parse(out) as unknown;
    } catch {
      // 忽略解析错误，继续处理
    }
    // console.log("🐍 After transformRequest (snake_case) - data:", out);
    return data; // 不要改动 data
  },
];

// 4) 响应拦截器：这里的 res.data 已经是 camelCase
protectedClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!(error instanceof AxiosError)) {
      return Promise.reject(error);
    }

    const errorData = error.response?.data as { message?: string } | undefined;
    const errorMessage = errorData?.message;

    if (errorMessage) {
      console.log("❌ API Error:", {
        message: errorMessage,
        status: error.response?.status,
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

    if (error.response?.status === 401 && error.config && !error.config._retry) {
      error.config._retry = true;
      // 401 错误：token 无效，清除认证信息
      AuthStore.getState().clearAuth();
      await refreshTokens();
    }

    return Promise.reject(error);
  },
);

// 5) 刷新 token（防重入）- 暂时禁用，新后端可能没有 refresh token 功能
export const refreshTokens = onceAsync(async () => {
  try {
    // TODO: 实现 refresh token 功能（如果后端支持）
    // const { refreshToken, currentSessionId } = AuthStore.getState();
    // if (!refreshToken || !currentSessionId) {
    //   throw new Error("refreshToken or currentSessionId not found");
    // }
    // const tokens = await authApi.RefreshTokens({ refreshToken, sessionId: currentSessionId });
    // setTokensAndActivateAuth(tokens);
    throw new Error("Refresh token not implemented yet");
  } catch (error) {
    AuthStore.getState().clearAuth(); // Ensure all authentication information is cleared
    throw error;
  }
});
