"use client";

import { TableSortPicker } from "@/components/filters/TableSortPicker";
import { TableToolbar } from "@/components/ui/data-table";
import type { TableSortPreset } from "@/lib/table-sort-presets";
import type { SortDirection } from "@/lib/table-sort";

type TablePageToolbarProps = {
  columnPicker: React.ReactNode;
  presets: TableSortPreset[];
  sortKey: string;
  sortDir: SortDirection;
  onSelectSort: (sort: string, sortDir: SortDirection) => void;
};

export function TablePageToolbar({ columnPicker, presets, sortKey, sortDir, onSelectSort }: TablePageToolbarProps) {
  return (
    <TableToolbar>
      <TableSortPicker presets={presets} sortKey={sortKey} sortDir={sortDir} onSelect={onSelectSort} />
      {columnPicker}
    </TableToolbar>
  );
}
