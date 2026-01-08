import type {
  LoginParamsByEmail,
  LoginParamsByPhone,
  LoginResponse,
  RegisterParams,
  SendVerificationCodeParams,
  SignupParams,
  UpdateEmailParams,
  UpdatePasswordParams,
  UpdateUserParams,
  User,
  UserQueryParams,
} from "@/apis/domain";
import type { DataResponse } from "@/apis/types/api";

import axios from "axios";
import { API_ENDPOINTS } from "@/apis/types";
import { protectedClient, publicClient } from "@/apis/clients";
import { AuthStore } from "@/stores/authStore";
import { URL_PATHS } from "@/apis/types/ip";

// 邮箱登录
export const LoginByEmail = async (params: LoginParamsByEmail) => {
  const { data } = await publicClient.post<DataResponse<LoginResponse>>(URL_PATHS.USER.LOGIN_BY_EMAIL, params);
  return data.data;
};

// 手机号登录
export const LoginByPhone = async (params: LoginParamsByPhone) => {
  const { data } = await publicClient.post<DataResponse<LoginResponse>>(URL_PATHS.USER.LOGIN_BY_PHONE, params);
  return data.data;
};

// 发送验证码
export const SendVerificationCode = async (params: SendVerificationCodeParams) => {
  const { data } = await publicClient.post<DataResponse<{ message: string }>>(
    URL_PATHS.USER.SIGNUP_SEND_CODE,
    params,
  );
  return data.data;
};

// 用户自主注册（Signup）
export const Signup = async (params: SignupParams) => {
  // axios-case-converter 会自动将 camelCase 转换为 snake_case
  const { data } = await publicClient.post<DataResponse<LoginResponse>>(URL_PATHS.USER.SIGNUP, params);
  return data.data;
};

// 管理员帮别人注册（Register - 公开路由，但可能需要管理员权限）
export const Register = async (params: RegisterParams, avatarFile?: File): Promise<User> => {
  const url = URL_PATHS.USER.REGISTER;
  
  // 如果有头像文件，使用 FormData
  if (avatarFile) {
    const formData = new FormData();
    
    // 添加文本字段（转换为 snake_case）
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && key !== "avatar") {
        const snakeKey = key.replace(/([A-Z])/g, "_$1").toLowerCase();
        formData.append(snakeKey, String(value));
      }
    });
    
    // 添加头像文件
    formData.append("avatar", avatarFile);
    
    const { data } = await axios.post<DataResponse<User>>(
      `${API_ENDPOINTS.PURE}${url}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return data.data;
  }
  
  // 没有头像文件，使用 JSON（公开路由，不需要 token）
  const { data } = await publicClient.post<DataResponse<User>>(url, params);
  return data.data;
};

// 检查登录状态（后端只返回成功消息，不返回用户数据）
export const CheckLogin = async (): Promise<void> => {
  await protectedClient.get<DataResponse<null>>(URL_PATHS.USER.CHECK_LOGIN);
};

// 获取用户信息
export const GetUser = async (id: string): Promise<User> => {
  const url = URL_PATHS.USER.GET_USER.replace(":id", id);
  const { data } = await protectedClient.get<DataResponse<User>>(url);
  return data.data;
};

// 获取所有用户（管理员）
export const GetUsers = async (params?: UserQueryParams): Promise<{ users: User[]; total: number }> => {
  const response = await protectedClient.get<DataResponse<User[]>>(URL_PATHS.USER.GET_USERS, {
    params: params,
  });
  // 后端返回 data 是 User[] 数组，total 在 meta 中
  const total = (response.data.meta?.total as number) || response.data.data.length;
  return {
    users: response.data.data,
    total,
  };
};

// 更新用户信息（不包括头像、邮箱、密码）
// 注意：后端只返回成功消息，不返回更新后的用户数据，前端需要调用 GetUser 重新获取
// 头像更新：使用 UpdateAvatar API
// 邮箱更新：使用 UpdateEmail API
// 密码更新：使用 UpdatePassword API
export const UpdateUser = async (
  id: string,
  params: Partial<UpdateUserParams>,
): Promise<void> => {
  const url = URL_PATHS.USER.UPDATE_USER.replace(":id", id);
  await protectedClient.put<DataResponse<null>>(url, params);
};

// 删除用户
export const DeleteUser = async (id: string): Promise<void> => {
  const url = URL_PATHS.USER.DELETE_USER.replace(":id", id);
  await protectedClient.delete(url);
};

// 发送验证码到当前用户的邮箱（用于更新邮箱前验证）
export const SendVerificationCodeToCurrentEmail = async (): Promise<{ message: string }> => {
  const { data } = await protectedClient.post<DataResponse<{ message: string }>>(
    URL_PATHS.USER.SEND_CODE_TO_CURRENT_EMAIL,
  );
  return data.data;
};

// 更新邮箱（需要旧邮箱验证码、新邮箱、新邮箱验证码）
export const UpdateEmail = async (params: UpdateEmailParams): Promise<void> => {
  await protectedClient.put<DataResponse<null>>(URL_PATHS.USER.UPDATE_EMAIL, params);
};

// 更新密码（需要当前邮箱验证码和新密码）
export const UpdatePassword = async (params: UpdatePasswordParams): Promise<void> => {
  await protectedClient.put<DataResponse<null>>(URL_PATHS.USER.UPDATE_PASSWORD, params);
};

// 更新头像（只上传头像文件）
export const UpdateAvatar = async (avatarFile: File): Promise<void> => {
  const formData = new FormData();
  formData.append("avatar", avatarFile);

  await axios.put<DataResponse<null>>(
    `${API_ENDPOINTS.PURE}${URL_PATHS.USER.UPDATE_AVATAR}`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${AuthStore.getState().accessToken}`,
      },
    },
  );
};

// ========== Profile API ==========
// 获取用户资料（GetProfile 是 GetUser 的别名，保持语义清晰）
export const GetProfile = async (id: string): Promise<User> => {
  return await GetUser(id);
};

// 更新用户基本信息（firstName, lastName, phone, roleId）
// 注意：后端只返回成功消息，不返回更新后的用户数据，前端需要调用 GetUser 重新获取
export const UpdateProfileBasic = async (
  id: string,
  profile: Partial<User>,
): Promise<User> => {
  // UpdateUser 不再支持 email 和 password（它们有专门的更新接口）
  const { email, password, image, ...updateParams } = profile;
  await UpdateUser(id, updateParams);
  // 更新后重新获取用户数据
  return await GetUser(id);
};

// 更新用户头像
export const UpdateProfileAvatar = async (id: string, avatarFile: File): Promise<User> => {
  await UpdateAvatar(avatarFile);
  // 更新后重新获取用户数据
  return await GetUser(id);
};
