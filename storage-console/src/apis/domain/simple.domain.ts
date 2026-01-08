// Simple Domain Types - 所有简化类型统一定义在这里，避免重复

// ========== 用户相关 ==========

export interface UserSimple {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  roleName?: string;
  image?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

// ========== 分类相关 ==========

export interface CategorySimple {
  id: string;
  name: string;
}

export interface AuthCategorySimple {
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
}

// ========== 子分类相关 ==========

export interface SubcategorySimple {
  id: string;
  name: string;
}

export interface AuthSubcategorySimple {
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
}

