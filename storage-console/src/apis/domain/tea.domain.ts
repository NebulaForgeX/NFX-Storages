// Tea Domain Types - 基于 Sjgz-Backend

import type { CategorySimple, SubcategorySimple, UserSimple } from "./simple.domain";
import type { TeaStatusEnum } from "../types/enums";

// ========== 茶叶图片 ==========

export interface TeaImage {
  id: string;
  imageFile: string;
  index: number;
}

export interface TeaImageEditable {
  id: string; // 前端生成的 UUID
  imageFile: string; // 临时文件名或已有文件名
  index: number; // 图片顺序
  isTemp?: boolean; // 是否是临时图片（新上传的为 true，编辑页现有的为 false）
}


// ========== 茶叶响应（公开API - 只包含核心业务字段） ==========

export interface Tea {
  id: string;
  name: string;
  categoryId: string;
  subcategoryId: string;
  price: number;
  originalPrice?: number | null;
  stock: number;
  description: string;
  year: number;
  origin: string;
  treeType: string;
  form: string;
  weight: number;
  batch: string;
  storage: string;
  tags: string[];
  status: TeaStatusEnum;
  attributes?: Record<string, unknown>;
  views: number;
  images: TeaImage[];
  category?: CategorySimple;
  subcategory?: SubcategorySimple;
}

// ========== 茶叶响应（Auth路由 - 包含完整字段） ==========

export interface AuthTea {
  id: string;
  name: string;
  categoryId: string;
  subcategoryId: string;
  price: number;
  originalPrice?: number | null;
  stock: number;
  description: string;
  show: boolean;
  year: number;
  origin: string;
  treeType: string;
  form: string;
  weight: number;
  batch: string;
  storage: string;
  tags: string[];
  status: TeaStatusEnum;
  attributes?: Record<string, unknown>;
  views: number;
  editorId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  images: TeaImage[];
  category?: CategorySimple;
  subcategory?: SubcategorySimple;
  editor?: UserSimple;
}

// ========== 列表响应 ==========

export interface TeaList {
  teas: Tea[];
  total: number;
}

export interface AuthTeaList {
  teas: AuthTea[];
  total: number;
}

// ========== 查询参数 ==========

export interface GetTeaListQueryParams {
  categoryId?: string;
  subcategoryId?: string;
  limit?: number; // 默认 10，最大 100
  offset?: number; // 默认 0
  search?: string;
  yearFrom?: number;
  yearTo?: number;
}

export interface GetTeaListAuthQueryParams {
  categoryId?: string;
  subcategoryId?: string;
  limit?: number; // 默认 10，最大 100
  offset?: number; // 默认 0
  search?: string;
  yearFrom?: number;
  yearTo?: number;
}

// ========== 创建茶叶请求 ==========

export interface CreateTeaParams {
  name: string;
  categoryId: string;
  subcategoryId: string;
  price: number;
  originalPrice?: number | null;
  stock: number;
  description: string;
  show: boolean;
  year: number;
  origin: string;
  treeType: string;
  form: string;
  weight: number;
  batch: string;
  storage: string;
  tags: string[];
  status: TeaStatusEnum;
  attributes?: Record<string, unknown>;
  images: TeaImageEditable[]; // 至少一张图片
}

// ========== 更新茶叶请求（基础信息，不包括图片） ==========

export interface UpdateTeaParams {
  name?: string;
  categoryId?: string;
  subcategoryId?: string;
  price?: number;
  originalPrice?: number | null;
  stock?: number;
  description?: string;
  show?: boolean;
  year?: number;
  origin?: string;
  treeType?: string;
  form?: string;
  weight?: number;
  batch?: string;
  storage?: string;
  tags?: string[];
  status?: TeaStatusEnum;
  attributes?: Record<string, unknown>;
}

// ========== 更新茶叶图片请求 ==========

export interface UpdateTeaImagesParams {
  images: TeaImageEditable[]; // 新图片列表（包含 leftImages 和新临时图片）
}

// ========== 临时图片上传响应 ==========

export interface TempImageUploadResponse {
  tempFilename: string; // 临时文件名（UUID.jpg）
  previewUrl: string; // 预览URL（/images/tmp/tea/UUID.jpg）
}
