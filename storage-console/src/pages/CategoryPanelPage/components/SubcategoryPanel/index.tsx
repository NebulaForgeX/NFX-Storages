import { memo, useCallback, useMemo } from "react";
import { FolderTree } from "@/assets/icons/lucide";
import { useNavigate } from "react-router-dom";

import { VirtualList } from "@/components";
import { useSubcategoryList } from "@/hooks/useSubcategory";
import { SubcategoryListItem } from "@/elements/subCategory";
import { ROUTES } from "@/types/navigation";

import styles from "./styles.module.css";

interface SubcategoryPanelProps {
  categoryId: string;
  categoryName: string;
}

const SubcategoryPanel = memo(({ categoryId, categoryName }: SubcategoryPanelProps) => {
  const navigate = useNavigate();

  const filter = useMemo(() => ({ parentId: categoryId }), [categoryId]);

  const {
    data: subcategories = [],
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useSubcategoryList(["subcategories", "panel", categoryId], filter);

  const handleView = useCallback(
    (subcategory: Parameters<typeof SubcategoryListItem>[0]["subcategory"]) => {
      navigate(ROUTES.SUBCATEGORY_DETAIL.replace(":subcategoryId", subcategory.id));
    },
    [navigate]
  );

  const emptyStateContent = useMemo(
    () => (
      <div className={styles.emptyContainer}>
        <FolderTree size={48} strokeWidth={1.5} />
        <p className={styles.emptyText}>该分类下暂无子分类</p>
      </div>
    ),
    []
  );

  const height = useMemo(() => {
    switch (subcategories.length) {
      case 0:
        return "240px";
      case 1:
        return "360px";
      case 2:
        return "520px";
      default:
        return "520px";
    }
  }, [subcategories.length]);

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <h4 className={styles.panelTitle}>{categoryName} 的子分类</h4>
        <span className={styles.count}>{subcategories.length} 个</span>
      </div>
        <VirtualList
          data={subcategories}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          fetchNextPage={fetchNextPage}
          renderItem={(subcategory) => (
            <SubcategoryListItem
              key={subcategory.id}
              subcategory={subcategory}
              onClick={handleView}
            />
          )}
          estimateSize={120}
          height={height}
          getItemKey={(subcategory) => subcategory.id}
          emptyState={emptyStateContent}
        />

    </div>
  );
});

SubcategoryPanel.displayName = "SubcategoryPanel";

export default SubcategoryPanel;

