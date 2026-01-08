// Category Domain Types - 基于 Sjgz-Backend

import type { SubcategorySimple, AuthSubcategorySimple, UserSimple } from "./simple.domain";

// 简化版 Category（公开API）
export interface Category {
  id: string;
  name: string;
  description: string;
  key: string;
  image?: string;
  subcategories?: SubcategorySimple[];
}

// 完整版 Category（Auth API）
export interface AuthCategory {
  id: string;
  name: string;
  description: string;
  key: string;
  image?: string;
  show: boolean;
  editorId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  editor?: UserSimple;
  subcategories?: AuthSubcategorySimple[]; // Auth API 返回完整子分类信息
}

// 分类列表响应
export interface CategoryList {
  categories: Category[];
  total: number;
}

// Auth 分类列表响应
export interface AuthCategoryList {
  categories: AuthCategory[];
  total: number;
}

// 查询参数（公开）
export interface GetCategoryListQueryParams {
  offset?: number;
  limit?: number;
  search?: string;
  show?: boolean;
  sort?: string;
}

// 查询参数（Auth）
export interface GetCategoryListAuthQueryParams {
  offset?: number;
  limit?: number;
  search?: string;
  show?: boolean;
  sort?: string;
}

// 创建分类请求
export interface CreateCategoryParams {
  name: string;
  description: string;
  key: string;
  show?: boolean; // 可选，默认 true
  editorId: string;
}

// 更新分类请求
export interface UpdateCategoryParams {
  name?: string;
  description?: string;
  key?: string;
  show?: boolean; // 支持更新显示状态
}

