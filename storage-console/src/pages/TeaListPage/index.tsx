import { memo, useState } from "react";

import { SearchInput, Suspense, ShowFilter, type ShowFilterValue } from "@/components";

import { TeaHeader, TeaList, YearRangeFilter } from "./components";
import styles from "./styles.module.css";

const TeaListPage = memo(() => {
  const [searchKeyword, setSearchKeyword] = useState("");
  const [showFilter, setShowFilter] = useState<ShowFilterValue>({
    enabled: false,
    value: null,
  });
  const [yearRange, setYearRange] = useState<{ from?: number; to?: number }>({ from: undefined, to: undefined });

  return (
    <div className={styles.container}>
      <TeaHeader />

      <div className={styles.searchContainer}>
        <SearchInput
          value={searchKeyword}
          onChange={setSearchKeyword}
          placeholder="搜索茶叶名称..."
        />
        <YearRangeFilter value={yearRange} onChange={setYearRange} />

      </div>
      <ShowFilter value={showFilter} onChange={setShowFilter} />
      <Suspense
        loadingType="ecg"
        loadingText="加载茶叶中..."
        loadingSize="medium"
      >
        <TeaList searchKeyword={searchKeyword} showFilter={showFilter} yearRange={yearRange} />
      </Suspense>
    </div>
  );
});

TeaListPage.displayName = "TeaListPage";

export default TeaListPage;

