import type { AuthSubcategory } from "@/types";

import { memo, useMemo } from "react";
import { FolderTree, Hash, Image } from "@/assets/icons/lucide";
import { useNavigate } from "react-router-dom";

import { VirtualList } from "@/components";
import { useSubcategoryList } from "@/hooks/useSubcategory";
import { ROUTES } from "@/types/navigation";
import { buildImageUrl } from "@/utils/image";

import styles from "./styles.module.css";

interface SubcategoryListProps {
  categoryId: string;
}

const SubcategoryList = memo(({ categoryId }: SubcategoryListProps) => {
  const navigate = useNavigate();

  const filter = useMemo(() => {
    return { parentId: categoryId };
  }, [categoryId]);

  const {
    data: subcategories = [],
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useSubcategoryList(["subcategories", "parent", categoryId], filter);

  const handleClick = (subcategory: typeof subcategories[0]) => {
    navigate(ROUTES.SUBCATEGORY_DETAIL.replace(":subcategoryId", subcategory.id));
  };

  const emptyStateContent = useMemo(() => (
    <div className={styles.emptySubcategory}>
      <FolderTree size={48} strokeWidth={1.5} />
      <p>该分类暂无子分类</p>
    </div>
  ), []);

  return (
    <div className={styles.subcategorySection}>
      <h2 className={styles.sectionTitle}>子分类列表</h2>
      
      <VirtualList
        data={subcategories}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        fetchNextPage={fetchNextPage}
        renderItem={(subcategory) => (
          <SubcategoryListItem subcategory={subcategory} onClick={handleClick} />
        )}
        estimateSize={100}
        height="400px"
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

// ===== SubcategoryListItem 组件 =====
interface SubcategoryListItemProps {
  subcategory: AuthSubcategory;
  onClick: (subcategory: AuthSubcategory) => void;
}

const SubcategoryListItem = memo(({ subcategory, onClick }: SubcategoryListItemProps) => {
  const handleClick = () => {
    onClick(subcategory);
  };

  return (
    <div className={styles.subcategoryCard} onClick={handleClick}>
      {/* 图片 */}
      <div className={styles.imageContainer}>
        {subcategory.image ? (
          <img
            src={buildImageUrl(subcategory.image, "category")}
            alt={subcategory.name}
            className={styles.subcategoryImage}
            loading="lazy"
          />
        ) : (
          <div className={styles.imagePlaceholder}>
            <Image size={20} />
          </div>
        )}
      </div>

      {/* 内容 */}
      <div className={styles.contentContainer}>
        <div className={styles.headerRow}>
          <h3 className={styles.subcategoryName}>{subcategory.name}</h3>
          {subcategory.key && (
            <span className={styles.key}>
              <Hash size={12} />
              {subcategory.key}
            </span>
          )}
        </div>
        
        {subcategory.description && (
          <p className={styles.description}>{subcategory.description}</p>
        )}

        <div className={styles.metaRow}>
          <span className={`${styles.badge} ${subcategory.show ? styles.show : styles.hide}`}>
            {subcategory.show ? "显示" : "隐藏"}
          </span>
        </div>
      </div>
    </div>
  );
});

SubcategoryListItem.displayName = "SubcategoryListItem";