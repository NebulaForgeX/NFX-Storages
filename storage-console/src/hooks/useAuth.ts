import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";

import {
  LoginByEmail,
  LoginByPhone,
  Register,
  SendVerificationCode,
  Signup,
  GetUser,
  UpdateUser,
  UpdatePassword,
  SendVerificationCodeToCurrentEmail,
  UpdateEmail,
} from "@/apis/auth.api";
import { authEventEmitter, authEvents } from "@/events/auth";
import { profileKeys } from "@/hooks/useProfile";
import AuthStore, { useAuthStore } from "@/stores/authStore";
import LayoutStore from "@/stores/layoutStore";
import { showError, showSuccess } from "@/stores/modalStore";

// Helper function to prefetch user data after login
const prefetchUserData = async (queryClient: ReturnType<typeof useQueryClient>, userId: string) => {

  // 再次确认 token 存在
  const accessToken = AuthStore.getState().accessToken;
  if (!accessToken) {
    console.warn("Token not found, skipping prefetch");
    return;
  }

  // Prefetch user profile using React Query
  await queryClient.prefetchQuery({
    queryKey: profileKeys.byId(userId),
    queryFn: () => GetUser(userId),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useLoginByEmail = () => {
  const queryClient = useQueryClient();
  const setTokens = AuthStore.getState().setTokens;
  const setCurrentUserId = AuthStore.getState().setCurrentUserId;
  const setIsAuthValid = AuthStore.getState().setIsAuthValid;

  const { mutateAsync: loginByEmail, ...rest } = useMutation({
    mutationFn: LoginByEmail,
    onSuccess: async (response) => {
      if (response.token) {
        setTokens({  accessToken: response.token});
        setIsAuthValid(true);
        if (response.user?.id) {
          setCurrentUserId(response.user.id);
          await prefetchUserData(queryClient, response.user.id);
        }
        // 发布登录成功事件
        authEventEmitter.emit(authEvents.LOGIN_SUCCESS);
      }
    },
    onError: (error: AxiosError) => {
      showError("登录失败，请检查账号或密码是否正确。" + error.message);
    },
  });

  return { mutateAsync: loginByEmail, ...rest };
};

export const useLoginByPhone = () => {
  const queryClient = useQueryClient();
  const setTokens = AuthStore.getState().setTokens;
  const setCurrentUserId = AuthStore.getState().setCurrentUserId;
  const setIsAuthValid = AuthStore.getState().setIsAuthValid;
  const { mutateAsync: loginByPhone, ...rest } = useMutation({
    mutationFn: LoginByPhone,
    onSuccess: async (response) => {
      if (response.token) {
        setTokens({  accessToken: response.token});
        setIsAuthValid(true);
        if (response.user?.id) {
          setCurrentUserId(response.user.id);
          await prefetchUserData(queryClient, response.user.id);
        }
        // 发布登录成功事件
        authEventEmitter.emit(authEvents.LOGIN_SUCCESS);
      }
    },
    onError: (error: AxiosError) => {
      showError("登录失败，请检查账号或密码是否正确。" + error.message);
    },
  });

  return { mutateAsync: loginByPhone, ...rest };
};

// 发送验证码
export const useSendVerificationCode = () => {
  const { mutateAsync: sendCode, ...rest } = useMutation({
    mutationFn: SendVerificationCode,
    onSuccess: () => {
      // 验证码发送成功，无需特殊处理
    },
    onError: (error: AxiosError) => {
      showError("发送验证码失败，请稍后重试。" + error.message);
    },
  });

  return { mutateAsync: sendCode, ...rest };
};

// 用户自主注册（Signup）
export const useSignup = () => {
  const queryClient = useQueryClient();
  const setTokens = AuthStore.getState().setTokens;
  const setCurrentUserId = AuthStore.getState().setCurrentUserId;
  const setIsAuthValid = AuthStore.getState().setIsAuthValid;
  const { mutateAsync: signup, ...rest } = useMutation({
    mutationFn: Signup,
    onSuccess: async (response) => {
      if (response?.token) {
        setTokens({ accessToken: response.token });
        setIsAuthValid(true);
        if (response.user?.id) {
          setCurrentUserId(response.user.id);
          await prefetchUserData(queryClient, response.user.id);
        }
        // 发布登录成功事件
        authEventEmitter.emit(authEvents.LOGIN_SUCCESS);
      } else {
        showError("注册失败，请稍后重试。");
      }
    },
    onError: (error: AxiosError) => {
      showError(`注册失败，请稍后重试。${error.message ?? ""}`);
    },
  });

  return { mutateAsync: signup, ...rest };
};

// 管理员帮别人注册（Register - 需要认证）
export const useRegister = () => {
  const queryClient = useQueryClient();

  const { mutateAsync: register, ...rest } = useMutation({
    mutationFn: async (params: { data: Parameters<typeof Register>[0]; avatarFile?: File }) => {
      return await Register(params.data, params.avatarFile);
    },
    onSuccess: async () => {
      // 刷新用户列表
      await queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error: AxiosError) => {
      showError("创建用户失败，请稍后重试。" + error.message);
    },
  });

  return { mutateAsync: register, ...rest };
};

export const useLogOut = () => {
  const queryClient = useQueryClient();
  const clearAuth = AuthStore.getState().clearAuth;
  const { mutateAsync: logOut, ...rest } = useMutation({
    mutationFn: async () => {
      // 后端可能没有 logout 接口，直接清除本地状态
      clearAuth();
    },
    onSuccess: () => {
      clearAllStores();
      queryClient.clear();
    },
    onError: (error: AxiosError) => {
      showError("退出登录失败，请稍后再试。" + error.message);
      clearAllStores();
      queryClient.clear();
    },
  });

  return { mutateAsync: logOut, ...rest };
};

// Helper function to clear all stores
const clearAllStores = () => {
  // Clear auth store
  AuthStore.getState().clearAuth();

  // Clear layout store (optional - reset to default)
  LayoutStore.getState().setSidebarOpen(false);
};

// 更新密码（需要当前邮箱验证码和新密码）
export const useSetPassword = () => {
  const queryClient = useQueryClient();
  const currentUserId = useAuthStore((state) => state.currentUserId);

  return useMutation({
    mutationFn: async (params: { password: string; verificationCode: string }) => {
      await UpdatePassword({
        verificationCode: params.verificationCode,
        newPassword: params.password,
      });
    },
    onSuccess: async () => {
      if (currentUserId) {
        await queryClient.invalidateQueries({ queryKey: profileKeys.byId(currentUserId) });
      }
      showSuccess("密码更新成功！");
    },
    onError: (error: AxiosError) => {
      showError("设置密码失败，请检查验证码是否正确。" + error.message);
    },
  });
};

// 发送验证码到当前用户的邮箱（通过token解析获取用户ID和邮箱）
export const useSendVerificationCodeToCurrentEmail = () => {
  return useMutation({
    mutationFn: async () => {
      return await SendVerificationCodeToCurrentEmail();
    },
    onError: (error: AxiosError) => {
      showError("发送验证码失败，请重试。" + error.message);
    },
  });
};

// 发送验证码到新邮箱（用于更新邮箱时验证新邮箱）
export const useSendSetEmailOTP = () => {
  return useMutation({
    mutationFn: async (params: { email: string }) => {
      // 使用现有的 SendVerificationCode API（与注册时发送验证码相同）
      return await SendVerificationCode({ email: params.email });
    },
    onError: (error: AxiosError) => {
      showError("发送验证码失败，请重试。" + error.message);
    },
  });
};

// 更新邮箱（需要旧邮箱验证码、新邮箱、新邮箱验证码）
export const useVerifyAndSetEmail = () => {
  const queryClient = useQueryClient();
  const currentUserId = useAuthStore((state) => state.currentUserId);

  return useMutation({
    mutationFn: async (params: { oldEmailCode: string; newEmail: string; newEmailCode: string }) => {
      await UpdateEmail({
        oldEmailCode: params.oldEmailCode,
        newEmail: params.newEmail,
        newEmailCode: params.newEmailCode,
      });
    },
    onSuccess: async () => {
      if (currentUserId) {
        await queryClient.invalidateQueries({ queryKey: profileKeys.byId(currentUserId) });
      }
      showSuccess("邮箱更新成功！");
    },
    onError: (error: AxiosError) => {
      showError("更新邮箱失败，请检查验证码是否正确。" + error.message);
    },
  });
};

// 设置手机号（不需要验证码，直接更新）
export const useVerifyAndSetPhone = () => {
  const queryClient = useQueryClient();
  const currentUserId = useAuthStore((state) => state.currentUserId);

  return useMutation({
    mutationFn: async (params: { phone: string; otp?: string }) => {
      if (!currentUserId) throw new Error("User ID is required");
      // 手机号不需要验证码，直接更新
      await UpdateUser(currentUserId, { phone: params.phone });
      // UpdateUser 不返回用户数据，依赖 invalidateQueries 重新获取
    },
    onSuccess: async () => {
      if (currentUserId) {
        await queryClient.invalidateQueries({ queryKey: profileKeys.byId(currentUserId) });
      }
      showSuccess("手机号更新成功！");
    },
    onError: (error: AxiosError) => {
      showError("更新手机号失败，请重试。" + error.message);
    },
  });
};
