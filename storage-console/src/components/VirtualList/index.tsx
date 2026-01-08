import type { VirtualizerOptions } from "@tanstack/react-virtual";
import type { ReactNode } from "react";

import { memo, useCallback, useEffect, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

import styles from "./styles.module.css";

interface VirtualListProps<T>
  extends Partial<
    Omit<
      VirtualizerOptions<HTMLDivElement, Element>,
      | "count"
      | "getScrollElement"
      | "observeElementRect"
      | "observeElementOffset"
      | "scrollToFn"
      | "getItemKey"
      | "estimateSize"
    >
  > {
  data: T[];
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  fetchNextPage?: () => void;
  renderItem: (item: T, index: number) => ReactNode;
  estimateSize?: number | ((index: number) => number);
  height?: string | number;
  getItemKey: (item: T, index: number) => string | number;
  emptyState?: ReactNode;
  loadingIndicator?: ReactNode;
  endOfListIndicator?: ReactNode;
  flexClass?: string;
  outerClass?: string;
  innerClass?: string;
}

function VirtualListComponent<T>({
  data,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  renderItem,
  estimateSize = 200,
  overscan = 5,
  height = "600px",
  getItemKey,
  emptyState,
  loadingIndicator,
  endOfListIndicator,
  flexClass,
  outerClass,
  innerClass,
  ...virtualizerOptions
}: VirtualListProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);

  // Setup virtualizer
  // eslint-disable-next-line react-hooks/incompatible-library
  const rowVirtualizer = useVirtualizer({
    count: hasNextPage ? data.length + 1 : data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: typeof estimateSize === "number" ? () => estimateSize : estimateSize,
    overscan,
    ...virtualizerOptions,
  });

  const items = rowVirtualizer.getVirtualItems();

  // Auto-fetch when scrolling near bottom (following official pattern)
  useEffect(() => {
    const [lastItem] = [...items].reverse();

    if (!lastItem) {
      return;
    }

    if (lastItem.index >= data.length - 1 && hasNextPage && !isFetchingNextPage && fetchNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, fetchNextPage, data.length, isFetchingNextPage, items]);

  const renderEmptyState = useCallback(() => {
    return (
      <div
        className={styles.virtualList}
        style={{
          height: typeof height === "number" ? `${height}px` : height,
        }}
      >
        {emptyState || (
          <div className={styles.emptyContainer}>
            <span>暂无数据</span>
          </div>
        )}
      </div>
    );
  }, [emptyState, height]);

  const renderLoadingIndicator = useCallback(() => {
    if (loadingIndicator) return loadingIndicator;
    return (
       <div className={styles.loadingMore}>
        <span>Loading more...</span>
      </div>
    );
  }, [loadingIndicator]); 

  const renderEndOfListIndicator = useCallback(() => {
    if (endOfListIndicator) return endOfListIndicator;
    return (
      <div className={styles.endOfList}>
        <span>No more items to load</span>
      </div>
    );
  }, [endOfListIndicator]);

  // Show empty state if no data
  if (data.length === 0) return renderEmptyState();

  return (
    <div
      ref={parentRef}
      className={`${styles.virtualList} ${outerClass ?? ""}`}
      style={{
        height: typeof height === "number" ? `${height}px` : height,
      }}
    >
      <div
        className={`${styles.virtualListInner} ${innerClass ?? ""}`}
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
        }}
      >
        <div
          className={`${styles.virtualListItems} ${flexClass ?? ""}`}
          style={{
            transform: `translateY(${items[0]?.start ?? 0}px)`,
            paddingTop: `2px`,
          }}
        >
          {items.map((virtualRow) => {
            const isLoaderRow = virtualRow.index > data.length - 1;
            const item = data[virtualRow.index];

            return (
              <div key={virtualRow.key} data-index={virtualRow.index} ref={rowVirtualizer.measureElement}>
                {isLoaderRow ? (
                  hasNextPage ? renderLoadingIndicator() : renderEndOfListIndicator()
                ) : (
                  <div key={getItemKey(item, virtualRow.index)}>{renderItem(item, virtualRow.index)}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Use memo with generic type
const VirtualList = memo(VirtualListComponent) as typeof VirtualListComponent;
export default VirtualList;
