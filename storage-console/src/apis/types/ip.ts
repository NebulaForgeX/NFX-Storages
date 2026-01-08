/*
 * prettier-ignore
 * This file contains constants for the backend API endpoints and WebSocket URLs.
 * API endpoints are based on Sjgz-Backend routes.
 */

// 从环境变量获取配置
const HTTP_BASE_URL = import.meta.env.VITE_API_URL || "http://192.168.1.64:10011";
const WS_BASE_URL = import.meta.env.VITE_WS_URL || "ws://192.168.1.64:10011";

// 图片服务 URL（独立配置）
// 开发环境：http://192.168.1.64:10011
// 生产环境：https://sjgztea.com
const IMAGE_BASE_URL =
  import.meta.env.VITE_IMAGE_URL ||
  (import.meta.env.VITE_BUILD_ENV === "prod" ? "https://api.sjgztea.com:10012" : "http://192.168.1.64:10011");

// API路由定义 - 基于 Sjgz-Backend
export const URL_PATHS = {
  // 用户服务 - /user
  USER: {
    // 公开路由
    REGISTER: "/user/register", // 管理员帮别人注册（公开路由）
    SIGNUP_SEND_CODE: "/user/signup/send-code", // 发送验证码
    SIGNUP: "/user/signup", // 用户自主注册
    LOGIN_BY_EMAIL: "/user/login/email", // 邮箱登录
    LOGIN_BY_PHONE: "/user/login/phone", // 手机号登录
    // 需要认证的路由 - /user/auth
    CHECK_LOGIN: "/user/auth/check-login",
    GET_USERS: "/user/auth/users",
    GET_USER: "/user/auth/:id",
    UPDATE_USER: "/user/auth/:id",
    DELETE_USER: "/user/auth/:id",
    // 邮箱更新相关
    SEND_CODE_TO_CURRENT_EMAIL: "/user/auth/email/send-code-to-current",
    UPDATE_EMAIL: "/user/auth/email/update",
    // 密码更新相关
    UPDATE_PASSWORD: "/user/auth/password/update",
    // 头像更新相关
    UPDATE_AVATAR: "/user/auth/avatar/update",
  },
  // 目录服务 - /catalog
  CATALOG: {
    // 公开路由
    CATEGORIES: "/catalog/categories",
    CATEGORY_BY_ID: "/catalog/categories/:id",
    SUBCATEGORIES: "/catalog/subcategories",
    SUBCATEGORY_BY_ID: "/catalog/subcategories/:id",
    TEAS: "/catalog/teas",
    TEA_BY_ID: "/catalog/teas/:id",
    TEA_ADD_VIEW: "/catalog/teas/:id/view",
    TEAS_BY_CATEGORY: "/catalog/teas/category/:categoryId",
    TEAS_BY_SUBCATEGORY: "/catalog/teas/subcategory/:subcategoryId",
    // 需要认证的路由 - /catalog/auth
    GET_CATEGORIES_AUTH: "/catalog/auth/categories",
    GET_CATEGORY_AUTH: "/catalog/auth/categories/:id",
    ADD_CATEGORY: "/catalog/auth/categories",
    UPDATE_CATEGORY: "/catalog/auth/categories/:id",
    UPDATE_CATEGORY_IMAGE: "/catalog/auth/categories/:id/image",
    DELETE_CATEGORY: "/catalog/auth/categories/:id",
    GET_SUBCATEGORIES_AUTH: "/catalog/auth/subcategories",
    GET_SUBCATEGORY_AUTH: "/catalog/auth/subcategories/:id",
    ADD_SUBCATEGORY: "/catalog/auth/subcategories",
    UPDATE_SUBCATEGORY: "/catalog/auth/subcategories/:id",
    UPDATE_SUBCATEGORY_IMAGE: "/catalog/auth/subcategories/:id/image",
    DELETE_SUBCATEGORY: "/catalog/auth/subcategories/:id",
    // Tea Auth 路由
    GET_TEAS_AUTH: "/catalog/auth/teas",
    GET_TEA_AUTH: "/catalog/auth/teas/:id",
    UPLOAD_TEMP_TEA_IMAGE: "/catalog/auth/teas/images/temp",
    CREATE_TEA: "/catalog/auth/teas",
    UPDATE_TEA: "/catalog/auth/teas/:id",
    UPDATE_TEA_IMAGES: "/catalog/auth/teas/:id/images",
    DELETE_TEA: "/catalog/auth/teas/:id",
    // 统计路由
    STATS_CATEGORIES_COUNT: "/catalog/auth/stats/categories/count",
    STATS_SUBCATEGORIES_COUNT: "/catalog/auth/stats/subcategories/count",
    STATS_TEAS_COUNT: "/catalog/auth/stats/teas/count",
    STATS_TEAS_VIEWS: "/catalog/auth/stats/teas/views",
  },
  // 图片服务 - /image
  IMAGE: {
    IMAGES: "/image/images/*",
    FAVICON: "/image/favicon.ico",
  },
} as const;

export const API_ENDPOINTS = {
  PURE: HTTP_BASE_URL,
  WS: WS_BASE_URL,
  IMAGE: IMAGE_BASE_URL, // 图片服务基础 URL
} as const;

// 类型定义
export type URL_PATHS_TYPE = typeof URL_PATHS;
export type API_ENDPOINTS_TYPE = typeof API_ENDPOINTS;

