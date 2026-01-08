// Subcategory Domain Types - 基于 Sjgz-Backend

import type { CategorySimple, UserSimple } from "./simple.domain";

// 简化版 Subcategory（公开API）
export interface Subcategory {
  id: string;
  name: string;
  description: string;
  key: string;
  image?: string;
  parentId: string;
  parent?: CategorySimple;
}

// 完整版 Subcategory（Auth API）
export interface AuthSubcategory {
  id: string;
  name: string;
  description: string;
  key: string;
  image?: string;
  show: boolean;
  parentId: string;
  editorId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  parent?: CategorySimple;
  editor?: UserSimple;
}

// 子分类列表响应
export interface SubcategoryList {
  subcategories: Subcategory[];
  total: number;
}

// Auth 子分类列表响应
export interface AuthSubcategoryList {
  subcategories: AuthSubcategory[];
  total: number;
}

// 查询参数（公开）
export interface GetSubcategoryListQueryParams {
  offset?: number;
  limit?: number;
  parentId?: string;
  search?: string;
  show?: boolean;
  sort?: string;
}

// 查询参数（Auth）
export interface GetSubcategoryListAuthQueryParams {
  offset?: number;
  limit?: number;
  parentId?: string;
  search?: string;
  show?: boolean;
  sort?: string;
}

// 创建子分类请求
export interface CreateSubcategoryParams {
  name: string;
  description: string;
  key: string;
  parentId: string;
  editorId: string;
}

// 更新子分类请求
export interface UpdateSubcategoryParams {
  name?: string;
  description?: string;
  key?: string;
  parentId?: string;
}

