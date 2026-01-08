import { memo } from "react";
import { Suspense } from "@/components";

import styles from "./styles.module.css";
import CategoryPanel from "./CategoryPanel";
import SubcategoryPanel from "./SubcategoryPanel";
import ShowSelectedCategory from "./ShowSelectedCategory";


const CategorySelector = memo(() => {
    return (
      <div className={styles.wrapper}>
        <div className={styles.container}>
          {/* Left: Categories (25% width) */}
          <Suspense
            loadingType="ecg"
            loadingText="加载分类中..."
            loadingSize="small"
            loadingContainerClassName={styles.emptyState}
          >
            <CategoryPanel/>
          </Suspense>

          {/* Right: Subcategories (75% width) - Grid with 3 columns */}
            <Suspense
              loadingType="ecg"
              loadingText="加载子分类中..."
              loadingSize="small"
              loadingContainerClassName={styles.emptyState}
            >
              <SubcategoryPanel/>
            </Suspense>
        </div>
        <ShowSelectedCategory/>
      </div>
    );
  }
);

CategorySelector.displayName = "CategorySelectorContent";
export default CategorySelector;

