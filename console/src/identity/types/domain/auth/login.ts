import type { ProfileRole } from "@/identity/enums/auth";

import { LanguageEnum, ProfileKindEnum } from "@/identity/enums/auth";

export namespace Login {
  export type ProfileKind = ProfileKindEnum;

  export interface ProfileItem {
    profileId: string;
    kind: ProfileKind;
    roles: ProfileRole[];
    displayName: Nullable<string>;
    avatarImageId: Nullable<string>;
    city: Nullable<string>;
    country: Nullable<string>;
  }

  export interface EmailItem {
    id: string;
    accountId: string;
    email: string;
    isPrimary: boolean;
    verifiedAt: Nullable<string>;
    createdAt: string;
    updatedAt: string;
  }

  export interface PhoneItem {
    id: string;
    accountId: string;
    phone: string;
    isPrimary: boolean;
    verifiedAt: Nullable<string>;
    createdAt: string;
    updatedAt: string;
  }

  export namespace Request {
    export interface LoginWithEmail {
      email: string;
      password: string;
      deviceId: string;
    }

    export interface LoginWithPhone {
      phone: string;
      password: string;
      deviceId: string;
    }

    export interface LoginWithGitHub {
      code: string;
      state: string;
      deviceId: string;
      signupPlatform: string;
    }

    export interface LinkGitHub {
      code: string;
      state: string;
    }

    export interface SelectProfile {
      profileId: string;
      kind: ProfileKindEnum;
      deviceId: string;
    }

    export interface CreateForgerProfile {
      displayName: string;
      profileLanguage: LanguageEnum;
    }

    export interface CreateAuthorityProfile {
      displayName: string;
      profileLanguage: LanguageEnum;
    }

    export interface CreateEmail {
      email: string;
    }

    export interface CreatePhone {
      phone: string;
    }

    export interface UpdatePhone {
      phone: string;
    }

    export interface VerifyPhone {
      verificationCode: string;
    }

    export interface UpdateEmail {
      email: string;
    }

    export interface VerifyEmail {
      verificationCode: string;
    }

    export interface SendEmailVerificationCode {
      lang?: LanguageEnum;
    }

    export interface SendChangePasswordVerificationCode {
      lang?: LanguageEnum;
    }

    export interface ChangePassword {
      currentPassword: string;
      newPassword: string;
      verificationCode: string;
    }
  }

  export namespace Response {
    export interface LoginWithEmail {
      accountId: string;
      accessToken: string;
      refreshToken: string;
      profiles: ProfileItem[];
    }

    export type LoginWithPhone = LoginWithEmail;
    export type LoginWithGitHub = LoginWithEmail;

    export interface GitHubAuthorizeUrl {
      authorizeUrl: string;
      state: string;
    }

    export interface SelectProfile {
      accountId: string;
      profileId: string;
      accessToken: string;
      refreshToken: string;
    }

    export interface CreateForgerProfile {
      profileId: string;
    }

    export interface CreateAuthorityProfile {
      profileId: string;
    }

    export interface CreateEmail {
      emailId: string;
    }

    export interface CreatePhone {
      phoneId: string;
    }
  }
}
