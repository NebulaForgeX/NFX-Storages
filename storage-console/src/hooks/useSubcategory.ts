import { makeUnifiedInfiniteQuery } from "@/hooks/core/makeUnifiedInfiniteQuery";
import { makeUnifiedQuery } from "@/hooks/core/makeUnifiedQuery";
import type { ListNumberCursorFetchResult } from "@/hooks/core/type";
import type {
  AuthSubcategory,
  AuthSubcategoryList,
  GetSubcategoryListAuthQueryParams,
} from "@/apis/domain";
import { GetSubcategoryByIdAuth, GetSubcategoryListAuth } from "@/apis/subcategory.api";

// 适配器：将 API 返回格式转换为 hook 期望的格式
const fetchSubcategoryList = async (
  params: Parameters<typeof GetSubcategoryListAuth>[0] & { offset: number; limit: number },
): Promise<ListNumberCursorFetchResult<AuthSubcategory>> => {
  const { offset, limit, ...restParams } = params;
  const result: AuthSubcategoryList = await GetSubcategoryListAuth({
    ...restParams,
    offset,
    limit,
  });
  // 转换格式：{ subcategories, total } -> { items, total }
  return {
    items: result.subcategories,
    total: result.total,
  };
};

// 适配器：获取单个子分类
const fetchSubcategoryById = async (params: { id: string }): Promise<AuthSubcategory> => {
  return GetSubcategoryByIdAuth(params.id);
};

// 创建无限查询 Hook（支持 Suspense 模式）
export const useSubcategoryList = makeUnifiedInfiniteQuery<AuthSubcategory, GetSubcategoryListAuthQueryParams>(
  fetchSubcategoryList,
  "suspense",
  20,
);

// 创建单个子分类查询 Hook（支持 Suspense 模式）
export const useSubcategory = makeUnifiedQuery<AuthSubcategory, { id: string }>(
  fetchSubcategoryById,
  "suspense",
);

