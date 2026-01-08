import { createStore, useStore } from "zustand";
import { persist, subscribeWithSelector } from "zustand/middleware";

interface TimerState {
  // 注册/登录验证码
  resendCodeExpiry: number | null;
  setResendCodeExpiry: (expiry: number) => void;
  clearResendCodeExpiry: () => void;
  canResendCode: () => boolean;
  getTimeLeft: () => number;

  // 邮箱更新 - 当前邮箱验证码
  emailUpdateCurrentExpiry: number | null;
  setEmailUpdateCurrentExpiry: (expiry: number) => void;
  clearEmailUpdateCurrentExpiry: () => void;
  canResendEmailUpdateCurrent: () => boolean;
  getEmailUpdateCurrentTimeLeft: () => number;

  // 邮箱更新 - 新邮箱验证码
  emailUpdateNewExpiry: number | null;
  setEmailUpdateNewExpiry: (expiry: number) => void;
  clearEmailUpdateNewExpiry: () => void;
  canResendEmailUpdateNew: () => boolean;
  getEmailUpdateNewTimeLeft: () => number;

  // 密码更新验证码
  passwordUpdateExpiry: number | null;
  setPasswordUpdateExpiry: (expiry: number) => void;
  clearPasswordUpdateExpiry: () => void;
  canResendPasswordUpdate: () => boolean;
  getPasswordUpdateTimeLeft: () => number;
}

export const TimerStore = createStore<TimerState>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // 注册/登录验证码
        resendCodeExpiry: null,
        setResendCodeExpiry: (expiry) => set({ resendCodeExpiry: expiry }),
        clearResendCodeExpiry: () => set({ resendCodeExpiry: null }),
        canResendCode: () => {
          const { resendCodeExpiry } = get();
          if (!resendCodeExpiry) return true;
          return Date.now() >= resendCodeExpiry;
        },
        getTimeLeft: () => {
          const { resendCodeExpiry } = get();
          if (!resendCodeExpiry) return 0;
          const timeLeft = Math.ceil((resendCodeExpiry - Date.now()) / 1000);
          return timeLeft > 0 ? timeLeft : 0;
        },

        // 邮箱更新 - 当前邮箱验证码
        emailUpdateCurrentExpiry: null,
        setEmailUpdateCurrentExpiry: (expiry) => set({ emailUpdateCurrentExpiry: expiry }),
        clearEmailUpdateCurrentExpiry: () => set({ emailUpdateCurrentExpiry: null }),
        canResendEmailUpdateCurrent: () => {
          const { emailUpdateCurrentExpiry } = get();
          if (!emailUpdateCurrentExpiry) return true;
          return Date.now() >= emailUpdateCurrentExpiry;
        },
        getEmailUpdateCurrentTimeLeft: () => {
          const { emailUpdateCurrentExpiry } = get();
          if (!emailUpdateCurrentExpiry) return 0;
          const timeLeft = Math.ceil((emailUpdateCurrentExpiry - Date.now()) / 1000);
          return timeLeft > 0 ? timeLeft : 0;
        },

        // 邮箱更新 - 新邮箱验证码
        emailUpdateNewExpiry: null,
        setEmailUpdateNewExpiry: (expiry) => set({ emailUpdateNewExpiry: expiry }),
        clearEmailUpdateNewExpiry: () => set({ emailUpdateNewExpiry: null }),
        canResendEmailUpdateNew: () => {
          const { emailUpdateNewExpiry } = get();
          if (!emailUpdateNewExpiry) return true;
          return Date.now() >= emailUpdateNewExpiry;
        },
        getEmailUpdateNewTimeLeft: () => {
          const { emailUpdateNewExpiry } = get();
          if (!emailUpdateNewExpiry) return 0;
          const timeLeft = Math.ceil((emailUpdateNewExpiry - Date.now()) / 1000);
          return timeLeft > 0 ? timeLeft : 0;
        },

        // 密码更新验证码
        passwordUpdateExpiry: null,
        setPasswordUpdateExpiry: (expiry) => set({ passwordUpdateExpiry: expiry }),
        clearPasswordUpdateExpiry: () => set({ passwordUpdateExpiry: null }),
        canResendPasswordUpdate: () => {
          const { passwordUpdateExpiry } = get();
          if (!passwordUpdateExpiry) return true;
          return Date.now() >= passwordUpdateExpiry;
        },
        getPasswordUpdateTimeLeft: () => {
          const { passwordUpdateExpiry } = get();
          if (!passwordUpdateExpiry) return 0;
          const timeLeft = Math.ceil((passwordUpdateExpiry - Date.now()) / 1000);
          return timeLeft > 0 ? timeLeft : 0;
        },
      }),
      {
        name: "timer-storage",
      },
    ),
  ),
);

export default TimerStore;
export const useTimerStore = <T>(selector: (state: TimerState) => T) => useStore(TimerStore, selector);
