import { memo, useState } from "react";

import { SearchInput, Suspense, ShowFilter, type ShowFilterValue } from "@/components";

import { CategoryHeader, CategoryList } from "./components";
import styles from "./styles.module.css";


// 主组件：使用 Suspense 包装
const CategoryListPage = memo(() => {
  const [searchKeyword, setSearchKeyword] = useState("");
  const [showFilter, setShowFilter] = useState<ShowFilterValue>({
    enabled: false,
    value: null,
  });

  return (
    <div className={styles.container}>
      <CategoryHeader />

      <div className={styles.searchContainer}>
        <SearchInput
          value={searchKeyword}
          onChange={setSearchKeyword}
          placeholder="搜索分类名称或标识..."
        />
        <ShowFilter value={showFilter} onChange={setShowFilter} />
      </div>

      <Suspense
        loadingType="ecg"
        loadingText="加载分类中..."
        loadingSize="medium"
      >
        <CategoryList searchKeyword={searchKeyword} showFilter={showFilter} />
      </Suspense>
    </div>
  );
});

CategoryListPage.displayName = "CategoryListPage";

export default CategoryListPage;

