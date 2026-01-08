import type {
  Category,
  AuthCategory,
  CategoryList,
  AuthCategoryList,
  GetCategoryListQueryParams,
  GetCategoryListAuthQueryParams,
  CreateCategoryParams,
  UpdateCategoryParams,
} from "@/apis/domain";
import type { DataResponse } from "@/apis/types/api";

import axios from "axios";
import { API_ENDPOINTS } from "@/apis/types";
import { protectedClient, publicClient } from "@/apis/clients";
import { AuthStore } from "@/stores/authStore";
import { URL_PATHS } from "@/apis/types/ip";

// ========== 公开路由（不需要认证） ==========

// 获取分类列表（公开）
export const GetCategoryList = async (
  params?: GetCategoryListQueryParams,
): Promise<CategoryList> => {
  const { data } = await publicClient.get<DataResponse<CategoryList>>(
    URL_PATHS.CATALOG.CATEGORIES,
    {
      params: params,
    },
  );
  return data.data;
};

// 根据 ID 获取分类（公开）
export const GetCategoryById = async (id: string): Promise<Category> => {
  const url = URL_PATHS.CATALOG.CATEGORY_BY_ID.replace(":id", id);
  const { data } = await publicClient.get<DataResponse<Category>>(url);
  return data.data;
};

// ========== 需要认证的路由 ==========

// 获取分类列表（Auth - 返回完整数据）
export const GetCategoryListAuth = async (
  params?: GetCategoryListAuthQueryParams,
): Promise<AuthCategoryList> => {
  const { data } = await protectedClient.get<DataResponse<AuthCategoryList>>(
    URL_PATHS.CATALOG.GET_CATEGORIES_AUTH,
    {
      params: params,
    },
  );
  return data.data;
};

// 根据 ID 获取分类（Auth - 返回完整数据）
export const GetCategoryByIdAuth = async (id: string): Promise<AuthCategory> => {
  const url = URL_PATHS.CATALOG.GET_CATEGORY_AUTH.replace(":id", id);
  const { data } = await protectedClient.get<DataResponse<AuthCategory>>(url);
  return data.data;
};

// 创建分类（需要认证）
// 支持 multipart/form-data，可以同时上传分类数据和图片
export const AddCategory = async (
  category: CreateCategoryParams,
  imageFile?: File
): Promise<AuthCategory> => {
  // 如果有图片，使用 FormData
  if (imageFile) {
    const formData = new FormData();
    formData.append("name", category.name);
    formData.append("description", category.description);
    formData.append("key", category.key);
    if (category.show !== undefined) {
      formData.append("show", category.show.toString());
    }
    formData.append("image", imageFile);

    const { data } = await axios.post<DataResponse<AuthCategory>>(
      `${API_ENDPOINTS.PURE}${URL_PATHS.CATALOG.ADD_CATEGORY}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${AuthStore.getState().accessToken}`,
        },
      }
    );
    return data.data;
  }

  // 没有图片，使用 JSON
  const { data } = await protectedClient.post<DataResponse<AuthCategory>>(
    URL_PATHS.CATALOG.ADD_CATEGORY,
    category,
  );
  return data.data;
};

// 更新分类（需要认证）
export const UpdateCategory = async (
  id: string,
  category: UpdateCategoryParams,
): Promise<void> => {
  const url = URL_PATHS.CATALOG.UPDATE_CATEGORY.replace(":id", id);
  // 只发送有值的字段
  const payload: Record<string, any> = {};
  if (category.name !== undefined) payload.name = category.name;
  if (category.description !== undefined) payload.description = category.description;
  if (category.key !== undefined) payload.key = category.key;
  if (category.show !== undefined) payload.show = category.show;
  
  await protectedClient.put<DataResponse<null>>(url, payload);
};

// 更新分类图片（需要认证）
export const UpdateCategoryImage = async (id: string, imageFile: File): Promise<void> => {
  const formData = new FormData();
  formData.append("image", imageFile);

  const url = URL_PATHS.CATALOG.UPDATE_CATEGORY_IMAGE.replace(":id", id);
  await axios.put<DataResponse<null>>(`${API_ENDPOINTS.PURE}${url}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
      Authorization: `Bearer ${AuthStore.getState().accessToken}`,
    },
  });
};

// 删除分类（需要认证）
export const DeleteCategory = async (id: string): Promise<void> => {
  const url = URL_PATHS.CATALOG.DELETE_CATEGORY.replace(":id", id);
  await protectedClient.delete(url);
};
