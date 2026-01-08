import type {
  Subcategory,
  AuthSubcategory,
  SubcategoryList,
  AuthSubcategoryList,
  GetSubcategoryListQueryParams,
  GetSubcategoryListAuthQueryParams,
  CreateSubcategoryParams,
  UpdateSubcategoryParams,
} from "@/apis/domain";
import type { DataResponse } from "@/apis/types/api";

import axios from "axios";
import { API_ENDPOINTS } from "@/apis/types";
import { protectedClient, publicClient } from "@/apis/clients";
import { AuthStore } from "@/stores/authStore";
import { URL_PATHS } from "@/apis/types/ip";

// ========== 公开路由（不需要认证） ==========

// 获取子分类列表（公开）
export const GetSubcategoryList = async (
  params?: GetSubcategoryListQueryParams,
): Promise<SubcategoryList> => {
  const { data } = await publicClient.get<DataResponse<SubcategoryList>>(
    URL_PATHS.CATALOG.SUBCATEGORIES,
    {
      params: params,
    },
  );
  return data.data;
};

// 根据 ID 获取子分类（公开）
export const GetSubcategoryById = async (id: string): Promise<Subcategory> => {
  const url = URL_PATHS.CATALOG.SUBCATEGORY_BY_ID.replace(":id", id);
  const { data } = await publicClient.get<DataResponse<Subcategory>>(url);
  return data.data;
};

// ========== 需要认证的路由 ==========

// 获取子分类列表（Auth - 返回完整数据）
export const GetSubcategoryListAuth = async (
  params?: GetSubcategoryListAuthQueryParams,
): Promise<AuthSubcategoryList> => {
  const { data } = await protectedClient.get<DataResponse<AuthSubcategoryList>>(
    URL_PATHS.CATALOG.GET_SUBCATEGORIES_AUTH,
    {
      params: params,
    },
  );
  return data.data;
};

// 根据 ID 获取子分类（Auth - 返回完整数据）
export const GetSubcategoryByIdAuth = async (id: string): Promise<AuthSubcategory> => {
  const url = URL_PATHS.CATALOG.GET_SUBCATEGORY_AUTH.replace(":id", id);
  const { data } = await protectedClient.get<DataResponse<AuthSubcategory>>(url);
  return data.data;
};

// 创建子分类（需要认证）
export const AddSubcategory = async (
  subcategory: CreateSubcategoryParams,
): Promise<AuthSubcategory> => {
  const { data } = await protectedClient.post<DataResponse<AuthSubcategory>>(
    URL_PATHS.CATALOG.ADD_SUBCATEGORY,
    subcategory,
  );
  return data.data;
};

// 更新子分类（需要认证）
export const UpdateSubcategory = async (
  id: string,
  subcategory: UpdateSubcategoryParams,
): Promise<void> => {
  const url = URL_PATHS.CATALOG.UPDATE_SUBCATEGORY.replace(":id", id);
  await protectedClient.put<DataResponse<null>>(url, subcategory);
};

// 更新子分类图片（需要认证）
export const UpdateSubcategoryImage = async (id: string, imageFile: File): Promise<void> => {
  const formData = new FormData();
  formData.append("image", imageFile);

  const url = URL_PATHS.CATALOG.UPDATE_SUBCATEGORY_IMAGE.replace(":id", id);
  await axios.put<DataResponse<null>>(`${API_ENDPOINTS.PURE}${url}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
      Authorization: `Bearer ${AuthStore.getState().accessToken}`,
    },
  });
};

// 删除子分类（需要认证）
export const DeleteSubcategory = async (id: string): Promise<void> => {
  const url = URL_PATHS.CATALOG.DELETE_SUBCATEGORY.replace(":id", id);
  await protectedClient.delete(url);
};

