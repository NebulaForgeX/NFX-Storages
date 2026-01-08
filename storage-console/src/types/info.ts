import type { Category } from "@/apis/domain";
import type { ValueOf } from "@/utils/types";

export type UUID = string;
export type Timestamp = string;

export interface Tokens {
  accessToken: string;
}

export interface Brand {
  id: UUID;
  name: string;
  description?: string;
}

export interface ProductImage {
  id: string;
  url: string;
  index: number;
}

export interface ProductAddress {
  id: string;
  country: string;
  province?: string;
  city?: string;
  district?: string;
  detail?: string;
  postalCode?: string;
}

export interface ShippingMethod {
  id: string;
  name: string;
  description?: string;
  estimatedDays?: number;
}

export const ProductStatus = {
  Draft: "draft",
  Published: "published",
  Archived: "archived",
} as const;

export type ProductStatusEnum = ValueOf<typeof ProductStatus>;

// 通用类型函数：将 const 对象转换为联合类型

export const SearchTypeEnum = {
  Suggestion: "suggestion",
  History: "history",
  Frequent: "frequent",
} as const;

export type SearchTypeEnum = ValueOf<typeof SearchTypeEnum>;

export interface Search {
  id: UUID;
  userId: UUID;
  type: SearchTypeEnum;
  query: string;
  searchCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface DraftProduct {
  id: UUID;
  userId: UUID;
  title: string;
  description: string;
  price: number;
  originalPrice: number;
  stock: number;
  categoryId: string;
  category: Category;
  productImages: ProductImage[];
  productAddress: ProductAddress | null;
  supportedShippingMethods: ShippingMethod[];
  brand: Brand;
  brandId?: string;
  views: number;
  favorites: number;
  status: ProductStatusEnum;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
