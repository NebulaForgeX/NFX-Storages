import type { AxiosError } from "axios";

import { getApiError } from "./apiError";

export const IMMEDIATE_FORCE_LOGOUT_ERR_CODES = new Set([
  "AUTHORITY_PROFILE_SCOPE_REQUIRED",
  "AUTHORITY_PROFILE_INSUFFICIENT_ROLE",
  "INVALID_REFRESH_TOKEN",
]);

export function shouldImmediateForceLogoutOnApiError(error: unknown): boolean {
  const api = getApiError(error);
  if (!api?.errCode) return false;
  return IMMEDIATE_FORCE_LOGOUT_ERR_CODES.has(api.errCode);
}

export function shouldForceLogoutAfterAuthRetry(error: unknown): boolean {
  const axiosError = error as AxiosError;
  if (!axiosError?.isAxiosError) return false;
  const api = getApiError(error);
  if (api?.errCode !== "INVALID_TOKEN") return false;
  return axiosError.config?._retry === true;
}

export function shouldForceLogoutOnApiError(error: unknown): boolean {
  return shouldImmediateForceLogoutOnApiError(error) || shouldForceLogoutAfterAuthRetry(error);
}
