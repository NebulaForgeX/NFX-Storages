import type { AuthTea } from "@/apis/domain";

import { memo, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { VirtualWindowList, type ShowFilterValue } from "@/components";
import { TeaListItem } from "@/elements/tea";
import { useTeaList } from "@/hooks/useTea";
import { ROUTES } from "@/types/navigation";

import styles from "./styles.module.css";

interface TeaListProps {
  searchKeyword: string;
  showFilter: ShowFilterValue;
  yearRange: { from?: number; to?: number };
}

const TeaList = memo(({ searchKeyword, showFilter, yearRange }: TeaListProps) => {
  const navigate = useNavigate();

  const filter = useMemo(() => {
    const params: Record<string, any> = {};
    if (searchKeyword) {
      params.search = searchKeyword;
    }
    if (showFilter.enabled && showFilter.value !== null) {
      params.show = showFilter.value;
    }
    if (
      yearRange.from !== undefined &&
      yearRange.to !== undefined &&
      yearRange.from > yearRange.to
    ) {
      // ignore invalid range
    } else {
      if (yearRange.from !== undefined) params.yearFrom = yearRange.from;
      if (yearRange.to !== undefined) params.yearTo = yearRange.to;
    }
    return Object.keys(params).length > 0 ? params : undefined;
  }, [searchKeyword, showFilter, yearRange]);

  const {
    data: teas = [],
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useTeaList(
    [
      "teas",
      searchKeyword,
      showFilter.enabled ? showFilter.value : "all",
      yearRange.from ?? "undefined",
      yearRange.to ?? "undefined",
    ],
    filter,
    { staleTime: 30000 }
  );

  const handleView = useCallback(
    (tea: AuthTea) => {
      navigate(ROUTES.TEA_DETAIL.replace(":teaId", tea.id));
    },
    [navigate]
  );

  const emptyStateContent = useMemo(() => {
    if (searchKeyword) {
      return (
        <div className={styles.emptyState}>
          <p>未找到匹配的茶叶</p>
          <p className={styles.emptyHint}>尝试使用其他关键词搜索</p>
        </div>
      );
    }
    return (
      <div className={styles.emptyState}>
        <p>暂无茶叶数据</p>
        <p className={styles.emptyHint}>点击"添加茶叶"按钮创建第一个茶叶</p>
      </div>
    );
  }, [searchKeyword]);

  return (
    <div className={styles.container}>
      <VirtualWindowList
        data={teas}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        fetchNextPage={fetchNextPage}
        renderItem={(tea) => <TeaListItem tea={tea} onClick={handleView} />}
        estimateSize={180}
        // height="calc(100vh - 330px)"
        getItemKey={(tea) => tea.id}
        emptyState={emptyStateContent}
      />
    </div>
  );
});

TeaList.displayName = "TeaList";

export default TeaList;

