/**
 * Virtual list powered by react-virtuoso.
 * Multi-column layouts virtualize by row (same model as the legacy VirtualList).
 */
import type { CSSProperties, ReactNode, RefObject } from "react";

import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Box, Flex, Text } from "@radix-ui/themes";
import { safeStringable } from "nfx-ui/utils";
import { Virtuoso } from "react-virtuoso";

import { EmptyState } from "@/components/EmptyState";

type ColumnCount = 1 | 2 | 3 | 4 | 5;

type RowChunk<T> = {
  key: string;
  items: T[];
};

export interface VirtuosoListProps<T> {
  data: T[];
  renderItem: (item: T, index: number) => ReactNode;
  getItemKey: (item: T, index: number) => string | number;
  height?: string | number;
  isLoading?: boolean;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  fetchNextPage?: () => void;
  emptyState?: ReactNode;
  loadingIndicator?: ReactNode;
  endOfListIndicator?: ReactNode;
  emptyText?: ReactNode;
  emptyDescription?: ReactNode;
  loadingText?: ReactNode;
  loadingMoreText?: ReactNode;
  endOfListText?: ReactNode;
  outerClass?: string;
  innerClass?: string;
  itemClassName?: string;
  rowClassName?: string;
  columns?: ColumnCount;
  minItemWidth?: number;
  maxColumns?: ColumnCount;
  columnGap?: string;
  rowGap?: string;
}

const DEFAULT_MIN_ITEM_WIDTH = 340;
const DEFAULT_MAX_COLUMNS: ColumnCount = 3;
const DEFAULT_ROW_GAP = "var(--space-3)";
const DEFAULT_COLUMN_GAP = "var(--space-3)";

/** Radix spacing token `"3"` → `var(--space-3)`; passthrough `var(...)` / `12px`. */
function resolveGapToken(gap: string | undefined, fallback: string): string {
  if (gap == null || gap === "") return fallback;
  if (/^\d+$/.test(gap)) return `var(--space-${gap})`;
  return gap;
}

const listInsetTopStyle: CSSProperties = { height: DEFAULT_ROW_GAP, flexShrink: 0, pointerEvents: "none" };
const footerEndLabelStyle: CSSProperties = {
  padding: "var(--space-2) var(--space-3)",
  backgroundColor: "var(--color-panel-solid)",
  borderRadius: "var(--radius-3)",
};
const itemChildStyle: CSSProperties = { minWidth: 0 };

function resolveHeight(height: string | number | undefined): string | number {
  return height ?? "100%";
}

function resolveColumnCount(width: number, minItemWidth: number, maxColumns: ColumnCount): ColumnCount {
  const count = Math.floor(width / minItemWidth);
  return Math.min(maxColumns, Math.max(1, count)) as ColumnCount;
}

function chunkRows<T>(items: T[], columnCount: number, getItemKey: VirtuosoListProps<T>["getItemKey"]): RowChunk<T>[] {
  if (columnCount <= 1) {
    return items.map((item, index) => ({
      key: String(getItemKey(item, index)),
      items: [item],
    }));
  }

  const rows: RowChunk<T>[] = [];
  for (let i = 0; i < items.length; i += columnCount) {
    const itemsInRow = items.slice(i, i + columnCount);
    rows.push({
      key: itemsInRow.map((item, colIndex) => String(getItemKey(item, i + colIndex))).join("|"),
      items: itemsInRow,
    });
  }
  return rows;
}

function useResponsiveColumns(
  parentRef: RefObject<HTMLDivElement | null>,
  columns: ColumnCount | undefined,
  minItemWidth: number | undefined,
  maxColumns: ColumnCount,
): ColumnCount {
  const [autoColumns, setAutoColumns] = useState<ColumnCount>(1);

  useLayoutEffect(() => {
    if (columns != null || minItemWidth == null) return;

    const el = parentRef.current;
    if (!el) return;

    const update = () => {
      setAutoColumns(resolveColumnCount(el.clientWidth, minItemWidth, maxColumns));
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [columns, minItemWidth, maxColumns, parentRef]);

  if (columns != null) return columns;
  if (minItemWidth == null) return 1;
  return autoColumns;
}

function VirtuosoListComponent<T>({
  data,
  renderItem,
  getItemKey,
  height = "100%",
  isLoading = false,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  emptyState,
  loadingIndicator,
  endOfListIndicator,
  emptyText = "No data",
  emptyDescription,
  loadingText = "Loading...",
  loadingMoreText = "Loading more...",
  endOfListText = "No more items",
  outerClass,
  innerClass,
  itemClassName,
  rowClassName,
  columns,
  minItemWidth,
  maxColumns = DEFAULT_MAX_COLUMNS,
  columnGap,
  rowGap,
}: VirtuosoListProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);
  const safeData = Array.isArray(data) ? data : [];
  const dataLength = safeData.length;
  const resolvedHeight = resolveHeight(height);
  const effectiveRowGap = resolveGapToken(rowGap, DEFAULT_ROW_GAP);
  const effectiveColumnGap = resolveGapToken(columnGap, DEFAULT_COLUMN_GAP);
  const effectiveMinItemWidth = columns == null && minItemWidth == null ? undefined : (minItemWidth ?? DEFAULT_MIN_ITEM_WIDTH);
  const columnCount = useResponsiveColumns(parentRef, columns, effectiveMinItemWidth, maxColumns);
  const virtualRows = useMemo(() => chunkRows(safeData, columnCount, getItemKey), [columnCount, getItemKey, safeData]);

  const rowStyle = useMemo(
    (): CSSProperties => ({
      display: "grid",
      gap: effectiveColumnGap,
      width: "100%",
      marginBottom: effectiveRowGap,
    }),
    [effectiveColumnGap, effectiveRowGap],
  );

  const itemGapStyle = useMemo((): CSSProperties => ({ marginBottom: effectiveRowGap }), [effectiveRowGap]);

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage?.();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const Footer = useCallback(() => {
    if (hasNextPage) {
      if (loadingIndicator) return <>{loadingIndicator}</>;
      return (
        <Flex align="center" justify="center" py="8">
          <Text size="2" color="gray">
            {isFetchingNextPage ? loadingMoreText : ""}
          </Text>
        </Flex>
      );
    }
    if (dataLength === 0) return null;
    if (endOfListIndicator) return <>{endOfListIndicator}</>;
    return (
      <Flex align="center" justify="center" py="8" mt="3" style={{ borderTop: "1px solid var(--gray-a7)" }}>
        <Text as="span" size="2" color="gray" style={footerEndLabelStyle}>
          {endOfListText}
        </Text>
      </Flex>
    );
  }, [dataLength, endOfListIndicator, endOfListText, hasNextPage, isFetchingNextPage, loadingIndicator, loadingMoreText]);

  const Header = useCallback(() => <div style={listInsetTopStyle} aria-hidden />, []);

  const renderVirtualRow = useCallback(
    (rowIndex: number, row: RowChunk<T>) => {
      if (columnCount <= 1) {
        const item = row.items[0]!;
        return (
          <div className={safeStringable(itemClassName)} style={itemGapStyle}>
            {renderItem(item, rowIndex)}
          </div>
        );
      }

      return (
        <div className={safeStringable(rowClassName)} style={{ ...rowStyle, gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))` }}>
          {row.items.map((item, colIndex) => {
            const itemIndex = rowIndex * columnCount + colIndex;
            return (
              <div key={getItemKey(item, itemIndex)} className={itemClassName} style={itemChildStyle}>
                {renderItem(item, itemIndex)}
              </div>
            );
          })}
        </div>
      );
    },
    [columnCount, getItemKey, itemClassName, itemGapStyle, renderItem, rowClassName, rowStyle],
  );

  const rootClassName = [safeStringable(outerClass), safeStringable(innerClass)].filter(Boolean).join(" ");

  const rootProps = {
    ref: parentRef,
    width: "100%" as const,
    minWidth: "0" as const,
    px: { initial: "3" as const, sm: "4" as const },
    className: rootClassName || undefined,
    style: { height: resolvedHeight },
  };

  if (dataLength === 0 && isLoading) {
    return (
      <Box {...rootProps}>
        {loadingIndicator ?? (
          <Flex align="center" justify="center" height="100%">
            <Text size="2" color="gray">
              {loadingText}
            </Text>
          </Flex>
        )}
      </Box>
    );
  }

  if (dataLength === 0) {
    return (
      <Box {...rootProps}>
        {emptyState ?? (
          <Flex align="center" justify="center" height="100%">
            <EmptyState title={emptyText} description={emptyDescription} />
          </Flex>
        )}
      </Box>
    );
  }

  return (
    <Box {...rootProps}>
      <Virtuoso
        style={{ height: "100%" }}
        data={virtualRows}
        computeItemKey={(_index, row) => row.key}
        itemContent={renderVirtualRow}
        endReached={handleEndReached}
        increaseViewportBy={{ top: 200, bottom: 300 }}
        components={{ Header, Footer }}
      />
    </Box>
  );
}

const VirtuosoList = VirtuosoListComponent as typeof VirtuosoListComponent;
export default VirtuosoList;
