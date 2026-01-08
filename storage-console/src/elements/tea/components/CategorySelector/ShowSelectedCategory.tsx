
import { memo } from "react";
import styles from "./styles.module.css";

import { useCategoryStore } from "../../stores/categoryStore";

const ShowSelectedCategory = memo(() => {
  const category = useCategoryStore((state) => state.category);
  const subcategory = useCategoryStore((state) => state.subcategory);

  if (!category && !subcategory) {
    return null;
  }

  return (
      <div className={styles.selectedInfo}>
        {category && (  
          <div className={styles.selectedItem}>
            <span className={styles.selectedLabel}>已选分类：</span>
            <span className={styles.selectedValue}>{category.name}</span>
          </div>
        )}
        {subcategory && (
          <div className={styles.selectedItem}>
            <span className={styles.selectedLabel}>已选子分类：</span>
            <span className={styles.selectedValue}>{subcategory.name}</span>
          </div>
        )}
      </div>
  );
});

export default ShowSelectedCategory;

