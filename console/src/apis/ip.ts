const HTTP_BASE_URL = import.meta.env.VITE_API_URL || "";

export const URL_PATHS = {
  SYSTEM: {
    latest: "/system/system-state/latest",
    initialize: "/system/system-state/initialize",
    i18nErrors: (lang: string) => `/system/i18n/errors/${lang}`,
  },
  ADMIN: {
    sessionCredentials: "/nfxstorages/admin/v3/session/credentials",
  },
} as const;

export const API_ENDPOINTS = {
  PURE: HTTP_BASE_URL,
} as const;
