// Tea API - 基于 Sjgz-Backend
import type {
  Tea,
  AuthTea,
  TeaList,
  AuthTeaList,
  GetTeaListQueryParams,
  GetTeaListAuthQueryParams,
  CreateTeaParams,
  UpdateTeaParams,
  UpdateTeaImagesParams,
  TempImageUploadResponse,
} from "@/apis/domain";
import type { DataResponse } from "@/apis/types/api";

import { protectedClient, publicClient } from "@/apis/clients";
import { URL_PATHS } from "@/apis/types/ip";

// ========== 公开路由（不需要token） ==========

/**
 * 获取茶叶列表（公开）
 * GET /catalog/teas
 */
export const GetTeaList = async (params?: GetTeaListQueryParams): Promise<TeaList> => {
  const { data } = await publicClient.get<DataResponse<TeaList>>(URL_PATHS.CATALOG.TEAS, {
    params,
  });
  return data.data;
};

/**
 * 根据 ID 获取茶叶（公开）
 * GET /catalog/teas/:id
 */
export const GetTeaById = async (id: string): Promise<Tea> => {
  const url = URL_PATHS.CATALOG.TEA_BY_ID.replace(":id", id);
  const { data } = await publicClient.get<DataResponse<Tea>>(url);
  return data.data;
};

// ========== Auth 路由（需要token） ==========

/**
 * 获取茶叶列表（Auth）
 * GET /catalog/auth/teas
 */
export const GetTeaListAuth = async (params?: GetTeaListAuthQueryParams): Promise<AuthTeaList> => {
  console.log("GetTeaListAuth params:", params);
  const { data } = await protectedClient.get<DataResponse<AuthTeaList>>(URL_PATHS.CATALOG.GET_TEAS_AUTH, {
    params,
  });
  return data.data;
};

/**
 * 根据 ID 获取茶叶（Auth）
 * GET /catalog/auth/teas/:id
 */
export const GetTeaByIdAuth = async (id: string): Promise<AuthTea> => {
  const url = URL_PATHS.CATALOG.GET_TEA_AUTH.replace(":id", id);
  const { data } = await protectedClient.get<DataResponse<AuthTea>>(url);
  return data.data;
};

/**
 * 上传临时图片
 * POST /catalog/auth/teas/images/temp
 * @param imageFile - File 对象
 * @returns 临时文件名和预览URL
 */
export const UploadTempTeaImage = async (imageFile: File): Promise<TempImageUploadResponse> => {
  const formData = new FormData();
  formData.append("image", imageFile);

  const { data } = await protectedClient.post<DataResponse<TempImageUploadResponse>>(
    URL_PATHS.CATALOG.UPLOAD_TEMP_TEA_IMAGE,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return data.data;
};

/**
 * 创建茶叶
 * POST /catalog/auth/teas
 */
export const CreateTea = async (params: CreateTeaParams): Promise<AuthTea> => {
  const { data } = await protectedClient.post<DataResponse<AuthTea>>(
    URL_PATHS.CATALOG.CREATE_TEA,
    params
  );
  return data.data;
};

/**
 * 更新茶叶基础信息（不包括图片）
 * PUT /catalog/auth/teas/:id
 */
export const UpdateTea = async (id: string, params: UpdateTeaParams): Promise<void> => {
  const url = URL_PATHS.CATALOG.UPDATE_TEA.replace(":id", id);
  await protectedClient.put(url, params);
};

/**
 * 更新茶叶图片
 * PUT /catalog/auth/teas/:id/images
 */
export const UpdateTeaImages = async (id: string, params: UpdateTeaImagesParams): Promise<void> => {
  const url = URL_PATHS.CATALOG.UPDATE_TEA_IMAGES.replace(":id", id);
  await protectedClient.put(url, params);
};

/**
 * 删除茶叶
 * DELETE /catalog/auth/teas/:id
 */
export const DeleteTea = async (id: string): Promise<void> => {
  const url = URL_PATHS.CATALOG.DELETE_TEA.replace(":id", id);
  await protectedClient.delete(url);
};


export const AddTeaViewCount = async (id: string): Promise<void> => {
  const url = URL_PATHS.CATALOG.TEA_ADD_VIEW.replace(":id", id);
  await protectedClient.post(url);
};