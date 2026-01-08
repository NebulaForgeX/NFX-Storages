import type {
  FetchNumberListParams,
  FetchStringListParams,
  ListNumberCursorFetchResult,
  ListStringCursorFetchResult,
  NumberPagePayload,
  StringPagePayload,
} from "./type";

/**
 * 创建基于游标（Cursor）的分页获取函数
 *
 * 将标准的分页 API（基于 offset/limit）转换为游标分页函数，用于无限查询。
 * 自动计算下一页游标，并支持数据后处理。
 *
 * @template T - 数据项类型
 * @template F - 过滤器对象类型，必须是对象类型，默认为 Record<string, unknown>
 *
 * @param {Function} fetchFunc - 远程数据获取函数，接收 FetchListParams 参数，返回包含 items 和 total 的结果
 * @param {number} [pageSize=20] - 每页数据条数，默认 20
 * @param {Function} [postProcess] - 可选的数据后处理函数，在每次数据获取后调用
 *
 * @returns {Function} 返回一个游标分页函数，接收 pageParam（页码）和 filter（过滤器）参数
 *
 * @example
 * ```tsx
 * * 定义标准的分页 API
 * const fetchProductsAPI = async (params: { offset: number; limit: number; category?: string }) => {
 *   const response = await fetch('/api/products?' + new URLSearchParams(params));
 *   const { items, total } = await response.json();
 *   return { items, total };
 * };
 *
 * * 创建游标分页函数
 * const fetchProducts = makeCursorFetchFunction(
 *   fetchProductsAPI,
 *   20,
 *   (data) => {
 *     * 数据后处理：为每个商品添加缓存
 *     data.forEach(product => cache.set(product.id, product));
 *   }
 * );
 *
 * * 使用游标函数
 * const firstPage = await fetchProducts(0, { category: "electronics" });
 * * 返回: { data: Product[], nextCursor: 1 | undefined }
 *
 * if (firstPage.nextCursor) {
 *   const secondPage = await fetchProducts(firstPage.nextCursor, { category: "electronics" });
 *   * 返回: { data: Product[], nextCursor: 2 | undefined }
 * }
 * ```
 *
 * @remarks
 * **为什么需要游标转换？**
 * - React Query 的无限查询使用 pageParam（游标）来跟踪分页位置
 * - 后端 API 通常使用 offset/limit 分页，两者需要转换才能配合使用
 * - 游标模式更适合无限滚动，避免在组件中手动计算 offset
 *
 * **游标计算逻辑：**
 * - **offset 计算**：`offset = pageParam × pageSize`
 *   - 示例：pageParam=0 → offset=0（第一页）
 *   - 示例：pageParam=2, pageSize=20 → offset=40（第三页，跳过前 40 条）
 * - **nextCursor 判断**：`(pageParam + 1) × pageSize < total ? pageParam + 1 : undefined`
 *   - 如果下一页的起始位置小于总数，返回下一页页码
 *   - 否则返回 undefined，告知 React Query 没有更多数据
 *
 * **为什么 pageParam 从 0 开始？**
 * - 符合数组索引习惯，第 0 页、第 1 页...
 * - 计算 offset 时公式更简洁：`offset = pageParam × pageSize`
 * - 避免使用 1-based 索引时需要额外的 -1 运算
 *
 * **postProcess 的作用：**
 * - 在数据返回后、缓存前执行，适合进行副作用操作
 * - 常见用途：更新单项缓存、触发分析事件、数据预处理
 * - 不影响返回值，保持数据流的纯净性
 */
export function makeCursorFetchFunction<T, F extends object = Record<string, unknown>>(
  fetchFunc: (params: FetchNumberListParams<F>) => Promise<ListNumberCursorFetchResult<T>>,
  pageSize: number = 20,
  postProcess?: (data: T[]) => void,
) {
  return async (pageParam: number = 0, filter?: F): Promise<NumberPagePayload<T>> => {
    const payload = {
      ...filter,
      offset: pageParam * pageSize,
      limit: pageSize,
    } as FetchNumberListParams<F>;
    const { items, total } = await fetchFunc(payload);
    if (items?.length) postProcess?.(items);
    return {
      data: items,
      nextCursor: (pageParam + 1) * pageSize < total ? pageParam + 1 : undefined,
    };
  };
}

export function makeStringCursorFetchFunction<T, F extends object = Record<string, unknown>>(
  fetchFunc: (params: FetchStringListParams<F>) => Promise<ListStringCursorFetchResult<T>>,
  pageSize: number = 20,
  postProcess?: (data: T[]) => void,
) {
  return async (pageParam: string = "", filter?: F): Promise<StringPagePayload<T>> => {
    const payload = {
      ...filter,
      offset: pageParam,
      limit: pageSize,
    } as FetchStringListParams<F>;
    const { items, nextCursor } = await fetchFunc(payload);
    if (items?.length) postProcess?.(items);
    return {
      data: items,
      nextCursor: nextCursor,
    };
  };
}
