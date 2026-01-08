import type { AuthCategory } from "@/types";

import { memo, useCallback } from "react";
import { useFormContext } from "react-hook-form";
import { useCategoryList } from "@/hooks/useCategory";
import { VirtualList } from "@/components";

import styles from "./styles.module.css";
import type { TeaFormValues } from "../../controllers/teaSchema";

import CategoryStore from "../../stores/categoryStore";



const CategoryPanel = memo(() => {
  const setCategory = CategoryStore.getState().setCategory;
  const clearSubcategory = CategoryStore.getState().clearSubcategory;
  const { watch, setValue } = useFormContext<TeaFormValues>();
  const selectedCategoryId = watch("CategoryId");
  const { data: categories = [], hasNextPage, isFetchingNextPage, fetchNextPage } = useCategoryList(
    ["categories-selector"],
    undefined,
    { staleTime: 30000 }
  );

  const handleCategorySelect = useCallback(
    (category: AuthCategory) => {
      setValue("CategoryId", category.id, { shouldValidate: true });
      setValue("SubcategoryId", "", { shouldValidate: false });
      setCategory(category);
      clearSubcategory();
    },
    [setValue]
  );


  return (
    <div className={styles.categoriesPanel}>
      <VirtualList
        data={categories}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        fetchNextPage={fetchNextPage}
        renderItem={(cat) => (
        <button
          key={cat.id}
          className={`${styles.categoryItem} ${selectedCategoryId === cat.id ? styles.active : ""}`}
          onClick={() => handleCategorySelect(cat)}
        >
          {cat.name}
        </button>
        )}
        getItemKey={(cat) => cat.id}
        estimateSize={120}
        height="calc(100vh - 330px)"
        emptyState={
          <div className={styles.emptyState}>
            <p>暂无分类</p>
          </div>
        }
        outerClass={styles.categoriesList}
      />
    </div>
  );
});

CategoryPanel.displayName = "CategoryPanel";

export default CategoryPanel;