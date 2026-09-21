const HTTP_BASE_URL = import.meta.env.VITE_API_URL || "";

export const URL_PATHS = {
  ADMIN: {
    sessionCredentials: "/admin/v3/session/credentials",
    locales: (lang: string) => `/admin/v3/locales/${lang}`,
    messages: (lang: string) => `/admin/v3/messages/${lang}`,
  },
} as const;

export const API_ENDPOINTS = {
  PURE: HTTP_BASE_URL,
} as const;
