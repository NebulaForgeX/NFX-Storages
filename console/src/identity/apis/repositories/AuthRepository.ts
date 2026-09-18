import type { DataResponse, ListDTOWithTotalNumber } from "nfx-ui/types"
import type { FullAccountInfoByKind, Login, Profile, ProfileItemsByKind, Signup, Tokens } from "@/identity/types";

import { ProfileKindEnum } from "@/identity/enums/auth";

import { protectedClient, publicClient, publicClientWithoutTransform } from "../clients";
import { dataFromResponse, URL_PATHS } from "../ip";

export interface AuthRepository {
  GetErrorTranslations(lang: string): Promise<Record<string, string>>;
  SendVerificationCode(params: Signup.Request.SendVerificationCode): Promise<void>;
  SignupWithEmail(params: Signup.Request.SignupWithEmail): Promise<Signup.Response.SignupWithEmail>;
  LoginWithEmail(params: Login.Request.LoginWithEmail): Promise<Login.Response.LoginWithEmail>;
  LoginWithPhone(params: Login.Request.LoginWithPhone): Promise<Login.Response.LoginWithPhone>;
  GetGitHubAuthorizeUrl(): Promise<Login.Response.GitHubAuthorizeUrl>;
  LoginWithGitHub(params: Login.Request.LoginWithGitHub): Promise<Login.Response.LoginWithGitHub>;
  LinkGitHub(params: Login.Request.LinkGitHub): Promise<void>;
  UnlinkGitHub(): Promise<void>;
  SelectProfile(params: Login.Request.SelectProfile): Promise<Login.Response.SelectProfile>;
  GetCurrentFullAccountInformationWithProfile<K extends ProfileKindEnum>(kind: K): Promise<FullAccountInfoByKind<K>>;
  PatchProfile(kind: ProfileKindEnum, body: Profile.Request.PatchProfile): Promise<void>;
  PatchProfileSettings(kind: ProfileKindEnum, body: Profile.Request.PatchProfileSettings): Promise<void>;
  ConfirmProfileAvatar(kind: ProfileKindEnum, body: Profile.Request.ConfirmProfileAvatar): Promise<void>;
  ClearProfileAvatar(kind: ProfileKindEnum): Promise<void>;
  ConfirmProfileBackgrounds(kind: ProfileKindEnum, body: Profile.Request.ConfirmProfileBackgrounds): Promise<void>;
  ListProfiles<K extends ProfileKindEnum>(kind: K, params?: { limit?: number; offset?: number }): Promise<ListDTOWithTotalNumber<ProfileItemsByKind<K>[number]>>;
  DeleteProfile(kind: ProfileKindEnum, profileId: string): Promise<void>;
  UpdatePreference(kind: ProfileKindEnum, preference: string): Promise<void>;
  CreateForgerProfile(body: Login.Request.CreateForgerProfile): Promise<Login.Response.CreateForgerProfile>;
  CreateAuthorityProfile(body: Login.Request.CreateAuthorityProfile): Promise<Login.Response.CreateAuthorityProfile>;
  SearchForgerProfiles(params: Profile.Request.SearchProfiles): Promise<ListDTOWithTotalNumber<Profile.Response.ForgerProfileItem>>;
  SearchAuthorityProfiles(params: Profile.Request.SearchProfiles): Promise<ListDTOWithTotalNumber<Profile.Response.AuthorityProfileItem>>;
  GetPublicProfileCard(profileId: string): Promise<Profile.Response.ForgerProfileItem>;
  ListEmails(params?: { limit?: number; offset?: number }): Promise<ListDTOWithTotalNumber<Login.EmailItem>>;
  CreateEmail(body: Login.Request.CreateEmail): Promise<Login.Response.CreateEmail>;
  SendEmailVerificationCode(emailId: string, body?: Login.Request.SendEmailVerificationCode): Promise<void>;
  VerifyEmail(emailId: string, body: Login.Request.VerifyEmail): Promise<void>;
  UpdateEmail(emailId: string, body: Login.Request.UpdateEmail): Promise<void>;
  SetPrimaryEmail(emailId: string): Promise<void>;
  DeleteEmail(emailId: string): Promise<void>;
  ListPhones(params?: { limit?: number; offset?: number }): Promise<ListDTOWithTotalNumber<Login.PhoneItem>>;
  CreatePhone(body: Login.Request.CreatePhone): Promise<Login.Response.CreatePhone>;
  SendPhoneVerificationCode(phoneId: string): Promise<void>;
  VerifyPhone(phoneId: string, body: Login.Request.VerifyPhone): Promise<void>;
  UpdatePhone(phoneId: string, body: Login.Request.UpdatePhone): Promise<void>;
  SetPrimaryPhone(phoneId: string): Promise<void>;
  DeletePhone(phoneId: string): Promise<void>;
  SendChangePasswordVerificationCode(body?: Login.Request.SendChangePasswordVerificationCode): Promise<void>;
  ChangePassword(body: Login.Request.ChangePassword): Promise<void>;
  RefreshTokens(params: Tokens.Request.RefreshTokens): Promise<Tokens.Response.Tokens>;
  Logout(params: Tokens.Request.Logout): Promise<void>;
  ListOwnerForgerProfiles(params?: { limit?: number; offset?: number; query?: string }): Promise<ListDTOWithTotalNumber<Profile.Response.ForgerProfileItem>>;
  ListOwnerAuthorityProfiles(params?: { limit?: number; offset?: number; query?: string }): Promise<ListDTOWithTotalNumber<Profile.Response.AuthorityProfileItem>>;
  UpdateAuthorityProfileRoles(profileId: string, params: Profile.Request.UpdateAuthorityProfileRoles): Promise<void>;
}

export class ApiAuthRepository implements AuthRepository {
  async GetErrorTranslations(lang: string): Promise<Record<string, string>> {
    const { data } = await publicClientWithoutTransform.get<Record<string, string>>(URL_PATHS.AUTH.Locales.errorsByLang(lang));
    return data;
  }

  async SendVerificationCode(params: Signup.Request.SendVerificationCode): Promise<void> {
    await publicClient.post(URL_PATHS.AUTH.SignupSendCode, params);
  }

  async SignupWithEmail(params: Signup.Request.SignupWithEmail): Promise<Signup.Response.SignupWithEmail> {
    const { data } = await publicClient.post<DataResponse<Signup.Response.SignupWithEmail>>(URL_PATHS.AUTH.SignupWithEmail, params);
    return data.data;
  }

  async LoginWithEmail(params: Login.Request.LoginWithEmail): Promise<Login.Response.LoginWithEmail> {
    const { data } = await publicClient.post<DataResponse<Login.Response.LoginWithEmail>>(URL_PATHS.AUTH.LoginWithEmail, params);
    return data.data;
  }

  async LoginWithPhone(params: Login.Request.LoginWithPhone): Promise<Login.Response.LoginWithPhone> {
    const { data } = await publicClient.post<DataResponse<Login.Response.LoginWithPhone>>(URL_PATHS.AUTH.LoginWithPhone, params);
    return data.data;
  }

  async GetGitHubAuthorizeUrl(): Promise<Login.Response.GitHubAuthorizeUrl> {
    const { data } = await publicClient.get<DataResponse<Login.Response.GitHubAuthorizeUrl>>(URL_PATHS.AUTH.LoginGitHubUrl);
    return data.data;
  }

  async LoginWithGitHub(params: Login.Request.LoginWithGitHub): Promise<Login.Response.LoginWithGitHub> {
    const { data } = await publicClient.post<DataResponse<Login.Response.LoginWithGitHub>>(URL_PATHS.AUTH.LoginGitHub, params);
    return data.data;
  }

  async LinkGitHub(params: Login.Request.LinkGitHub): Promise<void> {
    await protectedClient.post(URL_PATHS.AUTH.Me.GitHub, params);
  }

  async UnlinkGitHub(): Promise<void> {
    await protectedClient.delete(URL_PATHS.AUTH.Me.GitHub);
  }

  async SelectProfile(params: Login.Request.SelectProfile): Promise<Login.Response.SelectProfile> {
    const { data } = await protectedClient.post<DataResponse<Login.Response.SelectProfile>>(URL_PATHS.AUTH.Me.SelectProfile, params);
    return dataFromResponse(data, "SelectProfile");
  }

  async GetCurrentFullAccountInformationWithProfile<K extends ProfileKindEnum>(kind: K): Promise<FullAccountInfoByKind<K>> {
    switch (kind) {
      case ProfileKindEnum.FORGER: {
        const { data } = await protectedClient.get<DataResponse<Profile.Response.FullAccountInformationWithForgerProfile>>(
          URL_PATHS.AUTH.Me.FullAccountInformationWithForgerProfile,
        );
        return dataFromResponse(data, "GetCurrentFullAccountInformationWithProfile") as FullAccountInfoByKind<K>;
      }
      case ProfileKindEnum.AUTHORITY: {
        const { data } = await protectedClient.get<DataResponse<Profile.Response.FullAccountInformationWithAuthorityProfile>>(
          URL_PATHS.AUTH.Me.FullAccountInformationWithAuthorityProfile,
        );
        return dataFromResponse(data, "GetCurrentFullAccountInformationWithProfile") as FullAccountInfoByKind<K>;
      }
      default:
        throw new Error("Invalid profile kind");
    }
  }

  async PatchProfile(kind: ProfileKindEnum, body: Profile.Request.PatchProfile): Promise<void> {
    switch (kind) {
      case ProfileKindEnum.FORGER:
        await protectedClient.patch<DataResponse<null>>(URL_PATHS.AUTH.Me.ForgerProfile, body);
        return;
      case ProfileKindEnum.AUTHORITY:
        await protectedClient.patch<DataResponse<null>>(URL_PATHS.AUTH.Me.AuthorityProfile, body);
        return;
      default:
        throw new Error("Invalid profile kind");
    }
  }

  async PatchProfileSettings(kind: ProfileKindEnum, body: Profile.Request.PatchProfileSettings): Promise<void> {
    switch (kind) {
      case ProfileKindEnum.FORGER:
        await protectedClient.patch<DataResponse<null>>(URL_PATHS.AUTH.Me.ForgerProfileSettings, body);
        return;
      case ProfileKindEnum.AUTHORITY:
        await protectedClient.patch<DataResponse<null>>(URL_PATHS.AUTH.Me.AuthorityProfileSettings, body);
        return;
      default:
        throw new Error("Invalid profile kind");
    }
  }

  async ConfirmProfileAvatar(kind: ProfileKindEnum, body: Profile.Request.ConfirmProfileAvatar): Promise<void> {
    switch (kind) {
      case ProfileKindEnum.FORGER:
        await protectedClient.put<DataResponse<null>>(URL_PATHS.AUTH.Me.ForgerProfileAvatars, body);
        return;
      case ProfileKindEnum.AUTHORITY:
        await protectedClient.put<DataResponse<null>>(URL_PATHS.AUTH.Me.AuthorityProfileAvatars, body);
        return;
      default:
        throw new Error("Invalid profile kind");
    }
  }

  async ClearProfileAvatar(kind: ProfileKindEnum): Promise<void> {
    switch (kind) {
      case ProfileKindEnum.FORGER:
        await protectedClient.delete<DataResponse<null>>(URL_PATHS.AUTH.Me.ForgerProfileAvatars);
        return;
      case ProfileKindEnum.AUTHORITY:
        await protectedClient.delete<DataResponse<null>>(URL_PATHS.AUTH.Me.AuthorityProfileAvatars);
        return;
      default:
        throw new Error("Invalid profile kind");
    }
  }

  async ConfirmProfileBackgrounds(kind: ProfileKindEnum, body: Profile.Request.ConfirmProfileBackgrounds): Promise<void> {
    switch (kind) {
      case ProfileKindEnum.FORGER:
        await protectedClient.put<DataResponse<null>>(URL_PATHS.AUTH.Me.ForgerProfileBackgrounds, body);
        return;
      case ProfileKindEnum.AUTHORITY:
        await protectedClient.put<DataResponse<null>>(URL_PATHS.AUTH.Me.AuthorityProfileBackgrounds, body);
        return;
      default:
        throw new Error("Invalid profile kind");
    }
  }

  async ListProfiles<K extends ProfileKindEnum>(kind: K, params: { limit?: number; offset?: number } = {}): Promise<ListDTOWithTotalNumber<ProfileItemsByKind<K>[number]>> {
    switch (kind) {
      case ProfileKindEnum.FORGER: {
        const { data } = await protectedClient.get<DataResponse<ListDTOWithTotalNumber<Profile.Response.ForgerProfileItem>>>(URL_PATHS.AUTH.Me.Profiles, { params });
        return dataFromResponse(data, "ListProfiles") as ListDTOWithTotalNumber<ProfileItemsByKind<K>[number]>;
      }
      case ProfileKindEnum.AUTHORITY: {
        const { data } = await protectedClient.get<DataResponse<ListDTOWithTotalNumber<Profile.Response.AuthorityProfileItem>>>(URL_PATHS.AUTH.Me.AuthorityProfiles, { params });
        return dataFromResponse(data, "ListProfiles") as ListDTOWithTotalNumber<ProfileItemsByKind<K>[number]>;
      }
      default:
        throw new Error("Invalid profile kind");
    }
  }

  async DeleteProfile(kind: ProfileKindEnum, profileId: string): Promise<void> {
    switch (kind) {
      case ProfileKindEnum.FORGER:
        await protectedClient.delete<DataResponse<null>>(URL_PATHS.AUTH.Me.ProfileById(profileId));
        return;
      case ProfileKindEnum.AUTHORITY:
        await protectedClient.delete<DataResponse<null>>(URL_PATHS.AUTH.Me.AuthorityProfileById(profileId));
        return;
      default:
        throw new Error("Invalid profile kind");
    }
  }

  async UpdatePreference(kind: ProfileKindEnum, preference: string): Promise<void> {
    switch (kind) {
      case ProfileKindEnum.FORGER:
        await protectedClient.put<DataResponse<null>>(URL_PATHS.AUTH.Me.ForgerProfilePreference, { preference });
        return;
      case ProfileKindEnum.AUTHORITY:
        await protectedClient.put<DataResponse<null>>(URL_PATHS.AUTH.Me.AuthorityProfilePreference, { preference });
        return;
      default:
        throw new Error("Invalid profile kind");
    }
  }

  async CreateForgerProfile(body: Login.Request.CreateForgerProfile): Promise<Login.Response.CreateForgerProfile> {
    const { data } = await protectedClient.post<DataResponse<Login.Response.CreateForgerProfile>>(URL_PATHS.AUTH.Me.Profiles, body);
    return dataFromResponse(data, "CreateForgerProfile");
  }

  async CreateAuthorityProfile(body: Login.Request.CreateAuthorityProfile): Promise<Login.Response.CreateAuthorityProfile> {
    const { data } = await protectedClient.post<DataResponse<Login.Response.CreateAuthorityProfile>>(URL_PATHS.AUTH.Me.AuthorityProfiles, body);
    return dataFromResponse(data, "CreateAuthorityProfile");
  }

  async SearchForgerProfiles(params: Profile.Request.SearchProfiles): Promise<ListDTOWithTotalNumber<Profile.Response.ForgerProfileItem>> {
    const { data } = await protectedClient.post<DataResponse<ListDTOWithTotalNumber<Profile.Response.ForgerProfileItem>>>(URL_PATHS.AUTH.Me.SearchForgerProfiles, params);
    return dataFromResponse(data, "SearchForgerProfiles");
  }

  async SearchAuthorityProfiles(params: Profile.Request.SearchProfiles): Promise<ListDTOWithTotalNumber<Profile.Response.AuthorityProfileItem>> {
    const { data } = await protectedClient.post<DataResponse<ListDTOWithTotalNumber<Profile.Response.AuthorityProfileItem>>>(URL_PATHS.AUTH.Me.SearchAuthorityProfiles, params);
    return dataFromResponse(data, "SearchAuthorityProfiles");
  }

  async GetPublicProfileCard(profileId: string): Promise<Profile.Response.ForgerProfileItem> {
    const { data } = await protectedClient.get<DataResponse<Profile.Response.ForgerProfileItem>>(URL_PATHS.AUTH.Me.PublicProfileCardById(profileId));
    return dataFromResponse(data, "GetPublicProfileCard");
  }

  async ListEmails(params: { limit?: number; offset?: number } = {}): Promise<ListDTOWithTotalNumber<Login.EmailItem>> {
    const { data } = await protectedClient.get<DataResponse<ListDTOWithTotalNumber<Login.EmailItem>>>(URL_PATHS.AUTH.Me.Emails, { params });
    return dataFromResponse(data, "ListEmails");
  }

  async CreateEmail(body: Login.Request.CreateEmail): Promise<Login.Response.CreateEmail> {
    const { data } = await protectedClient.post<DataResponse<Login.Response.CreateEmail>>(URL_PATHS.AUTH.Me.Emails, body);
    return dataFromResponse(data, "CreateEmail");
  }

  async SendEmailVerificationCode(emailId: string, body: Login.Request.SendEmailVerificationCode = {}): Promise<void> {
    await protectedClient.post(URL_PATHS.AUTH.Me.EmailSendVerificationCode(emailId), body);
  }

  async VerifyEmail(emailId: string, body: Login.Request.VerifyEmail): Promise<void> {
    await protectedClient.post(URL_PATHS.AUTH.Me.EmailVerify(emailId), body);
  }

  async UpdateEmail(emailId: string, body: Login.Request.UpdateEmail): Promise<void> {
    await protectedClient.patch(URL_PATHS.AUTH.Me.EmailById(emailId), body);
  }

  async SetPrimaryEmail(emailId: string): Promise<void> {
    await protectedClient.put(URL_PATHS.AUTH.Me.EmailPrimary(emailId));
  }

  async DeleteEmail(emailId: string): Promise<void> {
    await protectedClient.delete(URL_PATHS.AUTH.Me.EmailById(emailId));
  }

  async ListPhones(params: { limit?: number; offset?: number } = {}): Promise<ListDTOWithTotalNumber<Login.PhoneItem>> {
    const { data } = await protectedClient.get<DataResponse<ListDTOWithTotalNumber<Login.PhoneItem>>>(URL_PATHS.AUTH.Me.Phones, { params });
    return dataFromResponse(data, "ListPhones");
  }

  async CreatePhone(body: Login.Request.CreatePhone): Promise<Login.Response.CreatePhone> {
    const { data } = await protectedClient.post<DataResponse<Login.Response.CreatePhone>>(URL_PATHS.AUTH.Me.Phones, body);
    return dataFromResponse(data, "CreatePhone");
  }

  async SendPhoneVerificationCode(phoneId: string): Promise<void> {
    await protectedClient.post(URL_PATHS.AUTH.Me.PhoneSendVerificationCode(phoneId));
  }

  async VerifyPhone(phoneId: string, body: Login.Request.VerifyPhone): Promise<void> {
    await protectedClient.post(URL_PATHS.AUTH.Me.PhoneVerify(phoneId), body);
  }

  async UpdatePhone(phoneId: string, body: Login.Request.UpdatePhone): Promise<void> {
    await protectedClient.patch(URL_PATHS.AUTH.Me.PhoneById(phoneId), body);
  }

  async SetPrimaryPhone(phoneId: string): Promise<void> {
    await protectedClient.put(URL_PATHS.AUTH.Me.PhonePrimary(phoneId));
  }

  async DeletePhone(phoneId: string): Promise<void> {
    await protectedClient.delete(URL_PATHS.AUTH.Me.PhoneById(phoneId));
  }

  async SendChangePasswordVerificationCode(body: Login.Request.SendChangePasswordVerificationCode = {}): Promise<void> {
    await protectedClient.post(URL_PATHS.AUTH.Me.PasswordSendVerificationCode, body);
  }

  async ChangePassword(body: Login.Request.ChangePassword): Promise<void> {
    await protectedClient.put(URL_PATHS.AUTH.Me.Password, body);
  }

  async RefreshTokens(params: Tokens.Request.RefreshTokens): Promise<Tokens.Response.Tokens> {
    const { data } = await publicClient.post<DataResponse<Tokens.Response.Tokens>>(URL_PATHS.AUTH.Refresh, params);
    return dataFromResponse(data, "RefreshTokens");
  }

  async Logout(params: Tokens.Request.Logout): Promise<void> {
    await publicClient.post(URL_PATHS.AUTH.Logout, params);
  }

  async ListOwnerForgerProfiles(params: { limit?: number; offset?: number; query?: string } = {}): Promise<ListDTOWithTotalNumber<Profile.Response.ForgerProfileItem>> {
    const { data } = await protectedClient.get<DataResponse<ListDTOWithTotalNumber<Profile.Response.ForgerProfileItem>>>(URL_PATHS.AUTH.Owner.ForgerProfiles, { params });
    return dataFromResponse(data, "ListOwnerForgerProfiles");
  }

  async ListOwnerAuthorityProfiles(params: { limit?: number; offset?: number; query?: string } = {}): Promise<ListDTOWithTotalNumber<Profile.Response.AuthorityProfileItem>> {
    const { data } = await protectedClient.get<DataResponse<ListDTOWithTotalNumber<Profile.Response.AuthorityProfileItem>>>(URL_PATHS.AUTH.Owner.AuthorityProfiles, { params });
    return dataFromResponse(data, "ListOwnerAuthorityProfiles");
  }

  async UpdateAuthorityProfileRoles(profileId: string, params: Profile.Request.UpdateAuthorityProfileRoles): Promise<void> {
    await protectedClient.patch(URL_PATHS.AUTH.Owner.UpdateAuthorityProfileRoles(profileId), params);
  }
}
