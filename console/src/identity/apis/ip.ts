import type { DataResponse } from "nfx-ui/types";

import { path } from "nfx-ui/apis";

export { path } from "nfx-ui/apis";

function resolveIdentityApiUrl(): string {
  const identity = (import.meta.env.VITE_IDENTITY_API_URL as string | undefined)?.trim();
  if (identity) return identity.replace(/\/$/, "");
  const raw = (import.meta.env.VITE_API_URL as string | undefined)?.trim() ?? "";
  return raw.replace(/\/$/, "");
}

export function dataFromResponse<T>(res: DataResponse<T>, context: string): T {
  const v = res.data;
  if (v == null) {
    throw new Error(`API response missing data (${context})`);
  }
  return v;
}

export const API_ENDPOINTS = {
  IDENTITY: resolveIdentityApiUrl(),
} as const;

export const URL_PATHS = {
  AUTH: path("/auth", {
    LoginWithEmail: "/login/with-email",
    LoginWithPhone: "/login/with-phone",
    LoginGitHub: "/login/github",
    LoginGitHubUrl: "/login/github/url",
    SignupSendCode: "/signup/send-code",
    SignupWithEmail: "/signup/with-email",
    Refresh: "/refresh",
    Logout: "/logout",
    Locales: path("/locales", {
      errorsByLang: (lang: string) => `/${lang}`,
    }),
    Messages: path("/messages", {
      byLang: (lang: string) => `/${lang}`,
    }),
    Me: path("/me", {
      SelectProfile: "/select-profile",
      FullAccountInformationWithForgerProfile: "/full-account-information-with-forger-profile",
      FullAccountInformationWithAuthorityProfile: "/full-account-information-with-authority-profile",
      ForgerProfile: "/forger-profile",
      ForgerProfileSettings: "/forger-profile-settings",
      ForgerProfileAvatars: "/forger-profile/avatars",
      ForgerProfileBackgrounds: "/forger-profile/backgrounds",
      ForgerProfilePreference: "/forger-profile/preference",
      AuthorityProfile: "/authority-profile",
      AuthorityProfileSettings: "/authority-profile-settings",
      AuthorityProfileAvatars: "/authority-profile/avatars",
      AuthorityProfileBackgrounds: "/authority-profile/backgrounds",
      AuthorityProfilePreference: "/authority-profile/preference",
      Profiles: "/profiles",
      SearchForgerProfiles: "/profiles/search",
      ProfileById: (profileId: string) => `/profiles/${profileId}`,
      PublicProfileCardById: (profileId: string) => `/profiles/${profileId}/public-card`,
      AuthorityProfiles: "/authority-profiles",
      SearchAuthorityProfiles: "/authority-profiles/search",
      AuthorityProfileById: (profileId: string) => `/authority-profiles/${profileId}`,
      GitHub: "/github",
      Emails: "/emails",
      EmailById: (emailId: string) => `/emails/${emailId}`,
      EmailSendVerificationCode: (emailId: string) => `/emails/${emailId}/send-verification-code`,
      EmailVerify: (emailId: string) => `/emails/${emailId}/verify`,
      EmailPrimary: (emailId: string) => `/emails/${emailId}/primary`,
      Phones: "/phones",
      PhoneById: (phoneId: string) => `/phones/${phoneId}`,
      PhoneSendVerificationCode: (phoneId: string) => `/phones/${phoneId}/send-verification-code`,
      PhoneVerify: (phoneId: string) => `/phones/${phoneId}/verify`,
      PhonePrimary: (phoneId: string) => `/phones/${phoneId}/primary`,
      Password: "/password",
      PasswordSendVerificationCode: "/password/send-verification-code",
    }),
    Owner: path("/owner", {
      ForgerProfiles: "/forger-profiles",
      AuthorityProfiles: "/authority-profiles",
      UpdateAuthorityProfileRoles: (profileId: string) => `/authority-profiles/${profileId}/roles`,
    }),
  }),
  ASSET: path("/asset", {
    Locales: path("/locales", {
      errorsByLang: (lang: string) => `/${lang}`,
    }),
    Messages: path("/messages", {
      byLang: (lang: string) => `/${lang}`,
    }),
    Images: path("/images", {
      uploadUrl: "/upload-url",
      uploadUrls: "/upload-urls",
      confirm: "/confirm",
      confirmMany: "/confirm-images",
      deleteById: (id: string) => `/${id}`,
      fileById: (id: string) => `/${id}/file`,
    }),
    Files: path("/files", {
      uploadUrl: "/upload-url",
      uploadUrls: "/upload-urls",
      confirm: "/confirm",
      confirmMany: "/confirm-files",
      deleteById: (id: string) => `/${id}`,
      fileById: (id: string) => `/${id}/file`,
    }),
    Videos: path("/videos", {
      uploadUrl: "/upload-url",
      uploadUrls: "/upload-urls",
      confirm: "/confirm",
      confirmMany: "/confirm-videos",
      deleteById: (id: string) => `/${id}`,
      fileById: (id: string) => `/${id}/file`,
    }),
    Audios: path("/audios", {
      uploadUrl: "/upload-url",
      uploadUrls: "/upload-urls",
      confirm: "/confirm",
      confirmMany: "/confirm-audios",
      deleteById: (id: string) => `/${id}`,
      fileById: (id: string) => `/${id}/file`,
    }),
  }),
} as const;
