import type { UseQueryResult } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import type {
  AccentColorEnum,
  AppearanceEnum,
  AuthAuthorityRoleEnum,
  AuthForgerRoleEnum,
  AuthSignupPlatformEnum,
  GrayColorEnum,
  LanguageEnum,
  PanelBackgroundEnum,
  ProfileKindEnum,
  RadiusEnum,
  ScalingEnum,
  ThemeFontFamilyEnum,
} from "@/identity/enums/auth";

export namespace Profile {
  export namespace Request {
    export interface PatchProfile {
      profileLanguage?: LanguageEnum;
      displayName?: Nilable<string>;
      firstName?: Nilable<string>;
      lastName?: Nilable<string>;
      country?: Nilable<string>;
      city?: Nilable<string>;
      gender?: Nilable<string>;
      birthday?: Nilable<string>;
      website?: Nilable<string>;
      timezone?: Nilable<string>;
      bio?: Nilable<string>;
    }

    export interface PatchProfileSettings {
      loginNotification?: boolean;
    }

    export interface ConfirmProfileAvatar {
      imageId: string;
    }

    export interface ConfirmProfileBackgroundItem {
      imageId: string;
      sortOrder: number;
    }

    export interface ConfirmProfileBackgrounds {
      images: ConfirmProfileBackgroundItem[];
    }

    export interface SearchProfiles {
      query?: string;
      limit?: number;
      offset?: number;
    }

    export interface UpdateAuthorityProfileRoles {
      authorityRoles: AuthAuthorityRoleEnum[];
    }
  }

  export namespace Response {
    export interface ThemePreference {
      accent: Maybe<AccentColorEnum>;
      gray: Maybe<GrayColorEnum>;
      appearance: Maybe<AppearanceEnum>;
      radius: Maybe<RadiusEnum>;
      scaling: Maybe<ScalingEnum>;
      panelBackground: Maybe<PanelBackgroundEnum>;
      fontFamily: Maybe<ThemeFontFamilyEnum>;
    }

    export interface Preference {
      theme: Maybe<ThemePreference>;
      language: Maybe<LanguageEnum>;
    }

    export interface Account {
      id: string;
      accountStatus: string;
      signupPlatform: AuthSignupPlatformEnum;
      createdAt: string;
      updatedAt: string;
    }

    export interface Email {
      id: string;
      accountId: string;
      email: string;
      isPrimary: boolean;
      verifiedAt: Nullable<string>;
      createdAt: string;
      updatedAt: string;
    }

    export interface Phone {
      id: string;
      accountId: string;
      phone: string;
      isPrimary: boolean;
      verifiedAt: Nullable<string>;
      createdAt: string;
      updatedAt: string;
    }

    export interface IdentityLink {
      identityProvider: string;
      providerSubject: string;
      lastLoginAt: Nullable<string>;
    }

    export interface ProfileAvatar {
      id: string;
      profileId: string;
      imageId: string;
      isActive: boolean;
      createdAt: string;
      updatedAt: string;
    }

    export interface ProfileBackground {
      id: string;
      profileId: string;
      imageId: string;
      sortOrder: number;
      createdAt: string;
      updatedAt: string;
    }

    export interface ProfileSettings {
      loginNotification: boolean;
      createdAt: string;
      updatedAt: string;
    }

    export interface ProfileBase {
      profileId: string;
      accountId: string;
      profileLanguage: LanguageEnum;
      preference: Nilable<Preference>;
      displayName: Nullable<string>;
      firstName: Nullable<string>;
      lastName: Nullable<string>;
      country: Nullable<string>;
      city: Nullable<string>;
      gender: Nullable<string>;
      birthday: Nullable<string>;
      website: Nullable<string>;
      timezone: Nullable<string>;
      bio: Nullable<string>;
      createdAt: string;
      updatedAt: string;
      avatars: ProfileAvatar[];
      backgrounds: ProfileBackground[];
      settings: Nilable<ProfileSettings>;
    }

    export interface ForgerProfile extends ProfileBase {
      forgerRoles: AuthForgerRoleEnum[];
    }

    export interface AuthorityProfile extends ProfileBase {
      authorityRoles: AuthAuthorityRoleEnum[];
    }

    export interface FullAccountInformation {
      account: Account;
      emails: Email[];
      phones: Phone[];
      identities: IdentityLink[];
      forgerProfiles: ForgerProfile[];
      authorityProfiles: AuthorityProfile[];
    }

    export interface FullAccountInformationWithForgerProfile {
      account: Account;
      emails: Email[];
      phones: Phone[];
      identities: IdentityLink[];
      forgerProfile: Nullable<ForgerProfile>;
    }

    export interface FullAccountInformationWithAuthorityProfile {
      account: Account;
      emails: Email[];
      phones: Phone[];
      identities: IdentityLink[];
      authorityProfile: Nullable<AuthorityProfile>;
    }

    export interface ProfileItemBase {
      profileId: string;
      accountId: string;
      displayName: Nullable<string>;
      profileLanguage: LanguageEnum;
      city: Nullable<string>;
      country: Nullable<string>;
      website: Nullable<string>;
      timezone: Nullable<string>;
      birthday: Nullable<string>;
      avatarImageId: Nullable<string>;
      backgroundImageId: Nullable<string>;
      createdAt: string;
    }

    export interface ForgerProfileItem extends ProfileItemBase {
      forgerRoles: AuthForgerRoleEnum[];
    }

    export interface AuthorityProfileItem extends ProfileItemBase {
      authorityRoles: AuthAuthorityRoleEnum[];
    }
  }
}

export type FullAccountInfoByKind<K extends ProfileKindEnum> = K extends ProfileKindEnum.FORGER
  ? Profile.Response.FullAccountInformationWithForgerProfile
  : K extends ProfileKindEnum.AUTHORITY
    ? Profile.Response.FullAccountInformationWithAuthorityProfile
    : never;

export type ProfileItemsByKind<K extends ProfileKindEnum> = K extends ProfileKindEnum.FORGER
  ? Profile.Response.ForgerProfileItem[]
  : K extends ProfileKindEnum.AUTHORITY
    ? Profile.Response.AuthorityProfileItem[]
    : never;

export type CurrentProfileResult = {
  [K in ProfileKindEnum]: {
    kind: K;
    data: Maybe<FullAccountInfoByKind<K>>;
    profile: Nullable<Profile.Response.ProfileBase>;
    isLoading: boolean;
    isError: boolean;
    refetch: UseQueryResult<FullAccountInfoByKind<K>, AxiosError>["refetch"];
  };
}[ProfileKindEnum];
