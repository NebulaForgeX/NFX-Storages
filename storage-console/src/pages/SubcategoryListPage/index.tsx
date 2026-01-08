import { memo, useState } from "react";

import { SearchInput, Suspense, ShowFilter, type ShowFilterValue } from "@/components";

import { SubcategoryHeader, SubcategoryList } from "./components";
import styles from "./styles.module.css";

// 主组件：使用 Suspense 包装
const SubcategoryListPage = memo(() => {
  const [searchKeyword, setSearchKeyword] = useState("");
  const [showFilter, setShowFilter] = useState<ShowFilterValue>({
    enabled: false,
    value: null,
  });

  return (
    <div className={styles.container}>
      <SubcategoryHeader />

      <div className={styles.searchContainer}>
        <SearchInput
          value={searchKeyword}
          onChange={setSearchKeyword}
          placeholder="搜索子分类名称..."
        />
        <ShowFilter value={showFilter} onChange={setShowFilter} />
      </div>

      <Suspense
        loadingType="ecg"
        loadingText="加载子分类中..."
        loadingSize="medium"
      >
        <SubcategoryList searchKeyword={searchKeyword} showFilter={showFilter} />
      </Suspense>
    </div>
  );
});

SubcategoryListPage.displayName = "SubcategoryListPage";

export default SubcategoryListPage;

