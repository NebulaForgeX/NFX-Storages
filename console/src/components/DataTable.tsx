import { MailFilledIcon } from "nfx-ui/icons";
import type { ReactNode } from "react";

import { Table } from "@radix-ui/themes";
import { EmptyState } from "@/components";

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  empty?: string;
  loading?: boolean;
}

export function DataTable<T>({ columns, rows, rowKey, empty, loading }: DataTableProps<T>) {
  if (loading) {
    return <EmptyState icon={MailFilledIcon} title={empty ?? "Loading..."} />;
  }
  if (!rows.length) {
    return <EmptyState icon={MailFilledIcon} title={empty ?? "No data"} />;
  }
  return (
    <Table.Root variant="surface">
      <Table.Header>
        <Table.Row>
          {columns.map((column) => (
            <Table.ColumnHeaderCell key={column.key}>{column.header}</Table.ColumnHeaderCell>
          ))}
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {rows.map((row) => (
          <Table.Row key={rowKey(row)}>
            {columns.map((column) => (
              <Table.Cell key={column.key}>
                {column.render ? column.render(row) : String((row as Record<string, unknown>)[column.key] ?? "")}
              </Table.Cell>
            ))}
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Root>
  );
}
