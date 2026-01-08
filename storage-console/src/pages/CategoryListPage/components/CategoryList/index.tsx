import { memo, useCallback, useMemo } from "react";
import { Package } from "@/assets/icons/lucide";
import { useNavigate } from "react-router-dom";

import { VirtualWindowList, type ShowFilterValue } from "@/components";
import { useCategoryList } from "@/hooks/useCategory";
import { CategoryListItem } from "@/elements/category";
import { ROUTES } from "@/types/navigation";

import styles from "./styles.module.css";

interface CategoryListProps {
  searchKeyword: string;
  showFilter: ShowFilterValue;
}

// 内部组件：实际渲染分类列表
const CategoryList = memo(({ searchKeyword, showFilter }: CategoryListProps) => {
  const navigate = useNavigate();
  
  const filter = useMemo(() => {
    const params: Record<string, any> = {};
    if (searchKeyword) params.search = searchKeyword;
    if (showFilter.enabled && showFilter.value !== null) params.show = showFilter.value;
    return Object.keys(params).length > 0 ? params : undefined;
  }, [searchKeyword, showFilter]);

  const {
    data: categories = [],
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useCategoryList(
    ["categories", searchKeyword, showFilter.enabled ? showFilter.value : "all"],
    filter,
    { staleTime: 30000 }
  );

  const handleView = useCallback((category: Parameters<typeof CategoryListItem>[0]["category"]) => {
    navigate(ROUTES.CATEGORY_DETAIL.replace(":categoryId", category.id));
  }, [navigate]);

  const emptyStateContent = useMemo(() => {
    if (searchKeyword) {
      return (
        <div className={styles.emptyContainer}>
          <Package size={64} strokeWidth={1.5} />
          <h2 className={styles.emptyTitle}>未找到匹配的分类</h2>
          <p className={styles.emptyText}>尝试使用其他关键词搜索</p>
        </div>
      );
    }
    return (
      <div className={styles.emptyContainer}>
        <Package size={64} strokeWidth={1.5} />
        <h2 className={styles.emptyTitle}>暂无分类</h2>
        <p className={styles.emptyText}>点击"添加分类"按钮创建第一个分类</p>
      </div>
    );
  }, [searchKeyword]);

  return (
    <div className={styles.listContainer}>
      <VirtualWindowList
        data={categories}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        fetchNextPage={fetchNextPage}
        renderItem={(category) => (
          <CategoryListItem
            category={category}
            onClick={handleView}
          />
        )}
        estimateSize={120}
        // height="calc(100vh - 330px)"
        getItemKey={(category) => category.id}
        emptyState={emptyStateContent}
        loadingIndicator={
          <div className={styles.loadingMore}>
            <div className={styles.spinner}></div>
            <span>加载更多分类...</span>
          </div>
        }
        endOfListIndicator={
          <div className={styles.endState}>
            <div className={styles.endLine}></div>
            <span className={styles.endText}>已加载全部分类</span>
            <div className={styles.endLine}></div>
          </div>
        }
      />
    </div>
  );
});

CategoryList.displayName = "CategoryList";

export default CategoryList;