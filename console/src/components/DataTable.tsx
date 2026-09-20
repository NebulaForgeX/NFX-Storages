import { StackIcon } from "nfx-ui/icons";
import type { AnimatedIconComponent } from "nfx-ui/icons";
import type { ReactNode } from "react";

import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { DropdownMenu, IconButton, Table } from "@radix-ui/themes";
import EmptyState from "./EmptyState";

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  width?: string;
}

export interface RowAction {
  label: string;
  onSelect: () => void;
  color?: "red";
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  empty?: string;
  emptyIcon?: AnimatedIconComponent;
  loading?: boolean;
  onRowClick?: (row: T) => void;
  actions?: (row: T) => RowAction[];
  selectedKey?: string;
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  empty,
  emptyIcon,
  loading,
  onRowClick,
  actions,
  selectedKey,
}: DataTableProps<T>) {
  if (loading) {
    return <EmptyState icon={emptyIcon ?? StackIcon} title={empty ?? "Loading..."} />;
  }
  if (!rows.length) {
    return <EmptyState icon={emptyIcon ?? StackIcon} title={empty ?? "No data"} />;
  }
  return (
    <Table.Root variant="surface">
      <Table.Header>
        <Table.Row>
          {columns.map((column) => (
            <Table.ColumnHeaderCell key={column.key} style={column.width ? { width: column.width } : undefined}>
              {column.header}
            </Table.ColumnHeaderCell>
          ))}
          {actions ? <Table.ColumnHeaderCell width="56px" /> : null}
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {rows.map((row) => {
          const key = rowKey(row);
          const rowActions = actions?.(row) ?? [];
          return (
            <Table.Row
              key={key}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              style={{
                cursor: onRowClick ? "pointer" : undefined,
                background: selectedKey === key ? "var(--accent-a3)" : undefined,
              }}
            >
              {columns.map((column) => (
                <Table.Cell key={column.key}>
                  {column.render ? column.render(row) : String((row as Record<string, unknown>)[column.key] ?? "")}
                </Table.Cell>
              ))}
              {actions ? (
                <Table.Cell onClick={(event) => event.stopPropagation()}>
                  {rowActions.length ? (
                    <DropdownMenu.Root>
                      <DropdownMenu.Trigger>
                        <IconButton size="1" variant="ghost" aria-label="Actions">
                          <DotsHorizontalIcon />
                        </IconButton>
                      </DropdownMenu.Trigger>
                      <DropdownMenu.Content align="end">
                        {rowActions.map((action) => (
                          <DropdownMenu.Item
                            key={action.label}
                            color={action.color}
                            onSelect={() => action.onSelect()}
                          >
                            {action.label}
                          </DropdownMenu.Item>
                        ))}
                      </DropdownMenu.Content>
                    </DropdownMenu.Root>
                  ) : null}
                </Table.Cell>
              ) : null}
            </Table.Row>
          );
        })}
      </Table.Body>
    </Table.Root>
  );
}
