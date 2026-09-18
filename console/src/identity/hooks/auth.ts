import { ProfileKindEnum } from "@/identity/enums/auth";
import { AuthStore, hasSelectedProfile, useAuthStore } from "@/identity/stores/auth";

export function useIsAuthenticated(): boolean {
  return useAuthStore((s) => s.isAuthValid && hasSelectedProfile(s.currentProfileId));
}

export function useCurrentAccountId(): string {
  return useAuthStore((s) => s.currentAccountId);
}

export function useCurrentProfileId(): string {
  return useAuthStore((s) => s.currentProfileId);
}

export function useCurrentProfileKind(): ProfileKindEnum {
  return useAuthStore((s) => s.currentProfileKind);
}

export { hasSelectedProfile, AuthStore, useAuthStore };
