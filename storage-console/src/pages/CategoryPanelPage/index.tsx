import { memo, useState } from "react";

import { SearchInput, Suspense, ShowFilter, type ShowFilterValue } from "@/components";

import { CategoryPanelList } from "./components";
import styles from "./styles.module.css";

const CategoryPanelPage = memo(() => {
  const [searchKeyword, setSearchKeyword] = useState("");
  const [showFilter, setShowFilter] = useState<ShowFilterValue>({
    enabled: false,
    value: null,
  });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
          <h1 className={styles.title}>分类面板</h1>
          <p className={styles.subtitle}>折叠展开查看分类及其子分类</p>

      </div>

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
        <CategoryPanelList searchKeyword={searchKeyword} showFilter={showFilter} />
      </Suspense>
    </div>
  );
});

CategoryPanelPage.displayName = "CategoryPanelPage";

export default CategoryPanelPage;

