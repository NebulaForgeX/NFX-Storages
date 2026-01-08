import type { AuthSubcategory } from "@/types";

import { memo, useCallback } from "react";
import { Image } from "@/assets/icons/lucide";
import { useFormContext } from "react-hook-form";
import { useSubcategoryList } from "@/hooks/useSubcategory";
import { VirtualList } from "@/components";
import { buildImageUrl } from "@/utils/image";

import styles from "./styles.module.css";
import type { TeaFormValues } from "../../controllers/teaSchema";

import CategoryStore from "../../stores/categoryStore";

// 子分类面板（单独的 Suspense 组件）
const SubcategoryPanel = memo(() => {
  const setSubcategory = CategoryStore.getState().setSubcategory;
  const { watch, setValue } = useFormContext<TeaFormValues>();
  const selectedCategoryId = watch("CategoryId");
  const selectedSubcategoryId = watch("SubcategoryId");
  // 获取当前分类的子分类
  const { data: subcategories = [], hasNextPage, isFetchingNextPage, fetchNextPage } = useSubcategoryList(
    ["subcategories-selector", selectedCategoryId],
    selectedCategoryId ? { parentId: selectedCategoryId } : undefined,
    { staleTime: 30000 }
  );

  const handleSubcategorySelect = useCallback(
    (subcategory: AuthSubcategory) => {
      setValue("SubcategoryId", subcategory.id, { shouldValidate: true });
      setSubcategory(subcategory);
    },
    [setValue]
  );

  if (!selectedCategoryId) {
    return (
      <div className={styles.emptyState}>
        <p>请先选择一个分类</p>
      </div>
    );
  }


  return (
    <div className={styles.subcategoriesList}>
      <VirtualList
        data={subcategories}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        fetchNextPage={fetchNextPage}
        renderItem={(subcat) => (
            <button
              key={subcat.id}
              className={`${styles.subcategoryItem} ${selectedSubcategoryId === subcat.id ? styles.subActive : ""}`}
              onClick={() => handleSubcategorySelect(subcat)}
            >
              {subcat.image ? (
            <img
              src={buildImageUrl(subcat.image, "category")}
              alt={subcat.name}
              className={styles.subcategoryImage}
            />
          ) : (
            <div className={styles.imagePlaceholder}>
              <Image size={32} />
            </div>
          )}
          <span className={styles.subcategoryName}>{subcat.name}</span>
        </button>
        
      )}
      getItemKey={(subcat) => subcat.id}
      estimateSize={120}
      height="calc(100vh - 330px)"
      emptyState={
        <div className={styles.emptyState}>
          <p>该分类下暂无子分类</p>
        </div>
      }
      flexClass={styles.subcategoriesPanel}
    />
    </div>
  );
});

SubcategoryPanel.displayName = "SubcategoryPanel";
export default SubcategoryPanel;