import { memo, useCallback, useMemo } from "react";
import { FolderTree } from "@/assets/icons/lucide";
import { useNavigate } from "react-router-dom";

import { VirtualWindowList, type ShowFilterValue } from "@/components";
import { useSubcategoryList } from "@/hooks/useSubcategory";
import { SubcategoryListItem } from "@/elements/subCategory";
import { ROUTES } from "@/types/navigation";

import styles from "./styles.module.css";

interface SubcategoryListProps {
  searchKeyword: string;
  showFilter: ShowFilterValue;
}

// 内部组件：实际渲染子分类列表
const SubcategoryList = memo(({ searchKeyword, showFilter }: SubcategoryListProps) => {
  const navigate = useNavigate();
  
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
    data: subcategories = [],
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useSubcategoryList(
    ["subcategories", searchKeyword, showFilter.enabled ? showFilter.value : "all"],
    filter,
    { staleTime: 30000 }
  );

  const handleView = useCallback((subcategory: Parameters<typeof SubcategoryListItem>[0]["subcategory"]) => {
    navigate(ROUTES.SUBCATEGORY_DETAIL.replace(":subcategoryId", subcategory.id));
  }, [navigate]);

  const emptyStateContent = useMemo(() => {
    if (searchKeyword) {
      return (
        <div className={styles.emptyContainer}>
          <FolderTree size={64} strokeWidth={1.5} />
          <h2 className={styles.emptyTitle}>未找到匹配的子分类</h2>
          <p className={styles.emptyText}>尝试使用其他关键词搜索</p>
        </div>
      );
    }
    return (
      <div className={styles.emptyContainer}>
        <FolderTree size={64} strokeWidth={1.5} />
        <h2 className={styles.emptyTitle}>暂无子分类</h2>
        <p className={styles.emptyText}>点击"添加子分类"按钮创建第一个子分类</p>
      </div>
    );
  }, [searchKeyword]);

  return (
    <div className={styles.listContainer}>
      <VirtualWindowList
        data={subcategories}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        fetchNextPage={fetchNextPage}
        renderItem={(subcategory) => (
          <SubcategoryListItem
            subcategory={subcategory}
            onClick={handleView}
          />
        )}
        estimateSize={120}
        // height="calc(100vh - 330px)"
        getItemKey={(subcategory) => subcategory.id}
        emptyState={emptyStateContent}
        loadingIndicator={
          <div className={styles.loadingMore}>
            <div className={styles.spinner}></div>
            <span>加载更多子分类...</span>
          </div>
        }
        endOfListIndicator={
          <div className={styles.endState}>
            <div className={styles.endLine}></div>
            <span className={styles.endText}>已加载全部子分类</span>
            <div className={styles.endLine}></div>
          </div>
        }
      />
    </div>
  );
});

SubcategoryList.displayName = "SubcategoryList";

export default SubcategoryList;

