import { makeUnifiedInfiniteQuery } from "@/hooks/core/makeUnifiedInfiniteQuery";
import { makeUnifiedQuery } from "@/hooks/core/makeUnifiedQuery";
import type { ListNumberCursorFetchResult } from "@/hooks/core/type";
import type {
  AuthCategory,
  AuthCategoryList,
  GetCategoryListAuthQueryParams,
} from "@/apis/domain";
import { GetCategoryByIdAuth, GetCategoryListAuth } from "@/apis/category.api";

// 适配器：将 API 返回格式转换为 hook 期望的格式
const fetchCategoryList = async (
  params: Parameters<typeof GetCategoryListAuth>[0] & { offset: number; limit: number },
): Promise<ListNumberCursorFetchResult<AuthCategory>> => {
  const { offset, limit, ...restParams } = params;
  const result: AuthCategoryList = await GetCategoryListAuth({
    ...restParams,
    offset,
    limit,
  });
  // 转换格式：{ categories, total } -> { items, total }
  return {
    items: result.categories,
    total: result.total,
  };
};

// 适配器：获取单个分类
const fetchCategoryById = async (params: { id: string }): Promise<AuthCategory> => {
  return GetCategoryByIdAuth(params.id);
};

// 创建无限查询 Hook（支持 Suspense 模式）
export const useCategoryList = makeUnifiedInfiniteQuery<AuthCategory, GetCategoryListAuthQueryParams>(
  fetchCategoryList,
  "suspense",
  20,
);

// 创建单个分类查询 Hook（支持 Suspense 模式）
export const useCategory = makeUnifiedQuery<AuthCategory, { id: string }>(
  fetchCategoryById,
  "suspense",
);

