/**
 * Auth 枚举，镜像 Identity 后端。
 * ProfileKindEnum 与 JWT profile_scope 共用 wire 值 "forger" | "authority"。
 * 角色不在 JWT；能力门控按纯成员判定（hasRole / hasAnyRole）。
 */

import type { Nilable } from "nfx-ui/types";

import { safeArray, safeEnum } from "nfx-ui/utils";

export function hasRole<T>(role: T, roles: Nilable<readonly T[]>): boolean {
  return safeArray(roles).includes(role);
}

export function hasAnyRole<T>(roles: Nilable<readonly T[]>, ...candidates: T[]): boolean {
  return candidates.some((role) => hasRole(role, roles));
}

/** 与后端 ProfileKind / profile_scope 一致。 */
export enum ProfileKindEnum {
  FORGER = "forger",
  AUTHORITY = "authority",
}

export const DEFAULT_PROFILE_KIND = ProfileKindEnum.FORGER;
export const PROFILE_KIND_VALUES = Object.values(ProfileKindEnum);
export const ProfileKind = (value: Nilable<string>) => safeEnum(value, PROFILE_KIND_VALUES, DEFAULT_PROFILE_KIND);

/** 普通档 forger_roles。 */
export enum AuthForgerRoleEnum {
  FORGER = "forger",
}
export const DEFAULT_AUTH_FORGER_ROLE = AuthForgerRoleEnum.FORGER;
export const AUTH_FORGER_ROLE_VALUES = Object.values(AuthForgerRoleEnum);
export const AuthForgerRole = (value: Nilable<string>) => safeEnum(value, AUTH_FORGER_ROLE_VALUES, DEFAULT_AUTH_FORGER_ROLE);

/** 管理档 authority_roles。角色不是包含关系。 */
export enum AuthAuthorityRoleEnum {
  AUDITOR = "auditor",
  ADMINISTRATOR = "administrator",
  OWNER = "owner",
}

export const DEFAULT_AUTH_AUTHORITY_ROLE = AuthAuthorityRoleEnum.ADMINISTRATOR;
export const AUTH_AUTHORITY_ROLE_VALUES = Object.values(AuthAuthorityRoleEnum);
export const AuthAuthorityRole = (value: Nilable<string>) =>
  safeEnum(value, AUTH_AUTHORITY_ROLE_VALUES, DEFAULT_AUTH_AUTHORITY_ROLE);

/** 可通过 UI/API 分配的权限角色（owner 仅允许数据库手动变更）。 */
export const UI_ASSIGNABLE_AUTH_AUTHORITY_ROLES = AUTH_AUTHORITY_ROLE_VALUES.filter(
  (role): role is Exclude<AuthAuthorityRoleEnum, AuthAuthorityRoleEnum.OWNER> => role !== AuthAuthorityRoleEnum.OWNER,
);

export type ProfileRole = AuthForgerRoleEnum | AuthAuthorityRoleEnum;

export enum AuthSignupPlatformEnum {
  NFXIDENTITY = "nfxidentity",
  NFXNEWS = "nfxnews",
  NFXSTORAGES = "nfxstorages",
  NFXVAULT = "nfxvault",
}
export const DEFAULT_AUTH_SIGNUP_PLATFORM = AuthSignupPlatformEnum.NFXIDENTITY;
export const AUTH_SIGNUP_PLATFORM_VALUES = Object.values(AuthSignupPlatformEnum);
export const AuthSignupPlatform = (value: Nilable<string>) =>
  safeEnum(value, AUTH_SIGNUP_PLATFORM_VALUES, DEFAULT_AUTH_SIGNUP_PLATFORM);

export enum AuthIdentityProviderEnum {
  PASSWORD = "password",
  GITHUB = "github",
}
export const DEFAULT_AUTH_IDENTITY_PROVIDER = AuthIdentityProviderEnum.PASSWORD;
export const AUTH_IDENTITY_PROVIDER_VALUES = Object.values(AuthIdentityProviderEnum);
export const AuthIdentityProvider = (value: Nilable<string>) =>
  safeEnum(value, AUTH_IDENTITY_PROVIDER_VALUES, DEFAULT_AUTH_IDENTITY_PROVIDER);

export enum AssetKindEnum {
  IMAGES = "images",
  FILES = "files",
  VIDEOS = "videos",
  AUDIOS = "audios",
}
