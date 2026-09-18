import { AxiosError } from "axios";
import { AuthStore, clearAuth, isRejectedRefreshToken, markRejectedRefreshToken, setTokens } from "@/identity/stores/auth";
import { ensureDeviceIdStorage } from "nfx-ui/stores";
import { getApiError } from "nfx-ui/utils";
import { getJwtExpiresAtMs, getJwtIssuedAtMs } from "nfx-ui/utils";

import { getIdentityRepositories } from "@/identity/apis/activeIdentityRepositories";

export type AuthTokenRefreshSource = "proactive" | "401";

export const AUTH_TOKEN_REFRESH_REMAINING_RATIO = 0.1;
export const AUTH_TOKEN_REFRESH_MAX_BUFFER_MS = 60 * 60 * 1000;

const AUTH_REFRESH_LOCK_NAME = "nfx-auth-refresh";
const HARD_REFRESH_FAILURE_ERR_CODES = new Set(["REFRESH_TOKEN_NOT_FOUND", "INVALID_REFRESH_TOKEN"]);

let refreshPromise: Nullable<Promise<boolean>> = null;
let refreshTimer: Nullable<ReturnType<typeof setTimeout>> = null;

export function clearScheduledTokenRefresh() {
  if (refreshTimer != null) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }
}

function computeRefreshBufferMs(accessToken: string): Nullable<number> {
  const expiresAtMs = getJwtExpiresAtMs(accessToken);
  const issuedAtMs = getJwtIssuedAtMs(accessToken);
  if (expiresAtMs == null || issuedAtMs == null) return null;

  const lifetimeMs = expiresAtMs - issuedAtMs;
  if (lifetimeMs <= 0) return null;

  const bufferMs = lifetimeMs * AUTH_TOKEN_REFRESH_REMAINING_RATIO;
  if (bufferMs > AUTH_TOKEN_REFRESH_MAX_BUFFER_MS) return null;

  return bufferMs;
}

function isHardRefreshFailure(error: unknown): boolean {
  const errCode = getApiError(error)?.errCode;
  if (errCode && HARD_REFRESH_FAILURE_ERR_CODES.has(errCode)) return true;
  return error instanceof AxiosError && error.response?.status === 404;
}

export function scheduleAccessTokenRefresh(accessToken: string) {
  clearScheduledTokenRefresh();

  const expiresAtMs = getJwtExpiresAtMs(accessToken);
  if (expiresAtMs == null) return;

  const bufferMs = computeRefreshBufferMs(accessToken);
  if (bufferMs == null) {
    console.log("🕐 Proactive token refresh skipped (10% of TTL > 1h or missing iat/exp)");
    return;
  }

  const refreshAtMs = expiresAtMs - bufferMs;
  const delayMs = Math.max(refreshAtMs - Date.now(), 0);

  console.log(`🕐 Access token refresh scheduled in ${Math.round(delayMs / 1000)}s (10% buffer = ${Math.round(bufferMs / 1000)}s)`);

  refreshTimer = setTimeout(() => {
    void refreshAuthTokens("proactive")
      .then((ok) => {
        if (!ok) {
          clearScheduledTokenRefresh();
          return;
        }
        const nextAccessToken = AuthStore.getState().accessToken;
        if (nextAccessToken) scheduleAccessTokenRefresh(nextAccessToken);
      })
      .catch(() => {
        clearScheduledTokenRefresh();
      });
  }, delayMs);
}

async function withRefreshLock<T>(run: () => Promise<T>): Promise<T> {
  const locks = globalThis.navigator?.locks;
  if (locks?.request) return locks.request(AUTH_REFRESH_LOCK_NAME, run);
  return run();
}

export async function refreshAuthTokens(source: AuthTokenRefreshSource): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const tokenBeforeLock = AuthStore.getState().refreshToken;
      if (!tokenBeforeLock) {
        console.log(`❌ Auth refresh aborted: no refresh token (${source})`);
        return false;
      }

      return await withRefreshLock(async () => {
        const { refreshToken, accessToken } = AuthStore.getState();
        if (!refreshToken) return false;

        if (isRejectedRefreshToken(refreshToken)) {
          console.log(`⛔ Auth refresh skipped: refresh token already rejected (${source})`);
          return false;
        }

        if (refreshToken !== tokenBeforeLock) {
          if (accessToken) scheduleAccessTokenRefresh(accessToken);
          console.log(`✅ Auth tokens already rotated by another tab (${source})`);
          return true;
        }

        console.log(`🔄 Refreshing auth tokens (${source})...`);
        try {
          const tokens = await getIdentityRepositories().auth.RefreshTokens({
            refreshToken,
            deviceId: await ensureDeviceIdStorage(),
          });
          setTokens(tokens);
          scheduleAccessTokenRefresh(tokens.accessToken);
          console.log(`✅ Auth tokens refreshed (${source})`);
          return true;
        } catch (error) {
          console.log(`❌ Auth token refresh failed (${source})`, error);
          if (isHardRefreshFailure(error)) {
            markRejectedRefreshToken(refreshToken);
            clearScheduledTokenRefresh();
            clearAuth();
          }
          throw error;
        }
      });
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}
