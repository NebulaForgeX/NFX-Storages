import { makeUnifiedInfiniteQuery } from "@/hooks/core/makeUnifiedInfiniteQuery";
import { makeUnifiedQuery } from "@/hooks/core/makeUnifiedQuery";
import type { ListNumberCursorFetchResult } from "@/hooks/core/type";
import type {
  AuthTea,
  AuthTeaList,
  GetTeaListAuthQueryParams,
} from "@/apis/domain";
import { GetTeaByIdAuth, GetTeaListAuth } from "@/apis/tea.api";

// 适配器：将 API 返回格式转换为 hook 期望的格式
const fetchTeaList = async (
  params: Parameters<typeof GetTeaListAuth>[0] & { offset: number; limit: number },
): Promise<ListNumberCursorFetchResult<AuthTea>> => {
  const { offset, limit, ...restParams } = params;
  const result: AuthTeaList = await GetTeaListAuth({
    ...restParams,
    offset,
    limit,
  });
  // 转换格式：{ teas, total } -> { items, total }
  return {
    items: result.teas,
    total: result.total,
  };
};

// 适配器：获取单个茶叶
const fetchTeaById = async (params: { id: string }): Promise<AuthTea> => {
  return GetTeaByIdAuth(params.id);
};

// 创建无限查询 Hook（支持 Suspense 模式）
export const useTeaList = makeUnifiedInfiniteQuery<AuthTea, GetTeaListAuthQueryParams>(
  fetchTeaList,
  "suspense",
  20,
);

// 创建单个茶叶查询 Hook（支持 Suspense 模式）
export const useTea = makeUnifiedQuery<AuthTea, { id: string }>(
  fetchTeaById,
  "suspense",
);

