// User Domain Types - 基于 Sjgz-Backend

export interface Role {
  id: string;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password?: string; // 仅在创建/更新时使用，响应中不应返回
  roleId: string;
  image?: string; // 后端字段名是 image，不是 avatar
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;
  role?: Role; // 关联的角色信息
  country?: string;
  language?: string;
  timezone?: string;
  currency?: string;
}

// UserList 现在由后端直接返回 User[] 数组，total 在 meta 中
export type UserList = User[];

export interface LoginParamsByEmail {
  email: string;
  password: string;
}

export interface LoginParamsByPhone {
  phone: string;
  password: string;
}

export interface SendVerificationCodeParams {
  email: string;
}

// 用户自主注册（Signup）
export interface SignupParams {
  email: string;
  password: string;
  inviteCode: string; // 许可码/邀请码
  verificationCode: string; // 邮箱验证码
}

// 管理员帮别人注册（Register）
export interface RegisterParams {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  roleId: string;
  avatar?: File;
}

export interface LoginResponse {
  token: string; // 后端返回的是 token，不是 accessToken
  user: User;
}

export interface UserQueryParams {
  email?: string;
  phone?: string;
  limit?: number;
  offset?: number;
}

// 更新用户参数（与注册参数不同）
// 注意：email 和 password 不允许通过 UpdateUser 更新
// Email: 使用 UpdateEmail API（需要双重验证）
// Password: 使用 UpdatePassword API（需要邮箱验证码）
export interface UpdateUserParams {
  firstName?: string;
  lastName?: string;
  phone?: string;
  roleId?: string;
}

// 更新邮箱参数
export interface UpdateEmailParams {
  oldEmailCode: string; // 旧邮箱验证码
  newEmail: string; // 新邮箱
  newEmailCode: string; // 新邮箱验证码
}

// 更新密码参数
export interface UpdatePasswordParams {
  verificationCode: string; // 当前邮箱验证码
  newPassword: string; // 新密码
}
