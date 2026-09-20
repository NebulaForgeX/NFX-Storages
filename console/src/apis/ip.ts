const HTTP_BASE_URL = import.meta.env.VITE_API_URL || "";

export const URL_PATHS = {
  SYSTEM: {
    latest: "/system/system-state/latest",
    initialize: "/system/system-state/initialize",
    locales: (lang: string) => `/system/locales/${lang}`,
    messages: (lang: string) => `/system/messages/${lang}`,
  },
  ADMIN: {
    sessionCredentials: "/admin/v3/session/credentials",
  },
} as const;

export const API_ENDPOINTS = {
  PURE: HTTP_BASE_URL,
} as const;
