import { protectedClient } from "@/apis/clients";
import type { DataResponse } from "@/apis/types/api";

import type { CountResponse, ViewsResponse } from "./domain/stats.domain";
import { URL_PATHS } from "./types/ip";

/**
 * 获取分类总数
 */
export const GetCategoriesCount = async (): Promise<number> => {
  const { data } = await protectedClient.get<DataResponse<CountResponse>>(
    URL_PATHS.CATALOG.STATS_CATEGORIES_COUNT,
  );
  return data.data.count;
};

/**
 * 获取子分类总数
 */
export const GetSubcategoriesCount = async (): Promise<number> => {
  const { data } = await protectedClient.get<DataResponse<CountResponse>>(
    URL_PATHS.CATALOG.STATS_SUBCATEGORIES_COUNT,
  );
  return data.data.count;
};

/**
 * 获取茶叶总数
 */
export const GetTeasCount = async (): Promise<number> => {
  const { data } = await protectedClient.get<DataResponse<CountResponse>>(
    URL_PATHS.CATALOG.STATS_TEAS_COUNT,
  );
  return data.data.count;
};

/**
 * 获取茶叶总浏览量
 */
export const GetTeasViews = async (): Promise<number> => {
  const { data } = await protectedClient.get<DataResponse<ViewsResponse>>(
    URL_PATHS.CATALOG.STATS_TEAS_VIEWS,
  );
  return data.data.totalViews;
};

