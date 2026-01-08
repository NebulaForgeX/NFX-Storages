import { memo, useCallback, useMemo, useState } from "react";
import { Package } from "@/assets/icons/lucide";

import { Suspense, VirtualWindowList, type ShowFilterValue } from "@/components";
import { useCategoryList } from "@/hooks/useCategory";
import { CategoryListItem } from "@/elements/category";

import SubcategoryPanel from "../SubcategoryPanel";
import styles from "./styles.module.css";

interface CategoryPanelListProps {
  searchKeyword: string;
  showFilter: ShowFilterValue;
}

const CategoryPanelList = memo(({ searchKeyword, showFilter }: CategoryPanelListProps) => {
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);

  const filter = useMemo(() => {
    const params: Record<string, any> = {};
    if (searchKeyword) {
      params.search = searchKeyword;
    }
    if (showFilter.enabled && showFilter.value !== null) {
      params.show = showFilter.value;
    }
    return Object.keys(params).length > 0 ? params : undefined;
  }, [searchKeyword, showFilter]);

  const {
    data: categories = [],
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useCategoryList(
    ["categories", "panel", searchKeyword, showFilter.enabled ? showFilter.value : "all"],
    filter
  );

  const handleTogglePanel = useCallback(
    (category: Parameters<typeof CategoryListItem>[0]["category"]) => {
      setExpandedCategoryId((prev) => (prev === category.id ? null : category.id));
    },
    []
  );

  const renderItem = useCallback(
    (category: Parameters<typeof CategoryListItem>[0]["category"]) => {
      const isExpanded = expandedCategoryId === category.id;
      return (
        <div key={category.id} className={styles.panelItem}>
          <CategoryListItem
            category={category}
            onClick={handleTogglePanel}
          />
          {isExpanded && (
            <Suspense
              loadingType="ecg"
              loadingText="加载子分类中..."
              loadingSize="small"
            >
              <SubcategoryPanel
                categoryId={category.id}
                categoryName={category.name}
              />
            </Suspense>
          )}
        </div>
      );
    },
    [expandedCategoryId, handleTogglePanel]
  );

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
    <VirtualWindowList
      data={categories}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      fetchNextPage={fetchNextPage}
      renderItem={renderItem}
      estimateSize={200}
      // height="calc(100vh - 300px)"
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
  );
});

CategoryPanelList.displayName = "CategoryPanelList";

export default CategoryPanelList;

