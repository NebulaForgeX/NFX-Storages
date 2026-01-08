import type { Tokens } from "@/types";

import { createStore, useStore } from "zustand";
import { persist, subscribeWithSelector } from "zustand/middleware";

interface AuthState {
  isAuthValid: boolean;
  accessToken: string | null;
  currentUserId: string | null;
  setIsAuthValid: (isAuthValid: boolean) => void;
  setTokens: (tokens: Tokens) => void;
  setCurrentUserId: (userId: string) => void;
  getCurrentUserId: () => string | null;
  clearAuth: () => void;
}

export const AuthStore = createStore<AuthState>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        isAuthValid: false,
        accessToken: null,
        currentUserId: null,

        setIsAuthValid: (isAuthValid) => set({ isAuthValid }),

        setTokens: (tokens) =>
          set({
            accessToken: tokens.accessToken,
          }),

        setCurrentUserId: (userId) => set({ currentUserId: userId }),

        getCurrentUserId: () => (get().isAuthValid ? get().currentUserId : null),

        clearAuth: () =>
          set({
            isAuthValid: false,
            accessToken: null,
            currentUserId: null,
          }),
      }),
      {
        name: "auth-storage",
      },
    ),
  ),
);

export default AuthStore;
export const useAuthStore = <T>(selector: (state: AuthState) => T) => useStore(AuthStore, selector);

