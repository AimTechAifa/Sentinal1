"use client";

import { MagicCard } from "@/components/ui/magic-card";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ColumnDef } from "@/lib/table-column-types";
import type { SortDirection } from "@/lib/table-sort";

interface DataTableProps {
  title?: string;
  subtitle?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  toolbar?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function DataTable({ title, subtitle, icon: Icon, action, toolbar, children, className }: DataTableProps) {
  return (
    <MagicCard
      gradient="from-gray-200/70 via-white to-gray-200/70"
      className={cn("w-full max-w-full", className)}
      innerClassName="overflow-visible"
    >
      {(title || Icon || toolbar || action) && (
        <div className="flex items-center justify-between gap-3 border-b border-gray-200 bg-white px-6 py-5 dark:border-[var(--border)] dark:bg-[var(--card)]">
          <div className="flex min-w-0 items-center gap-3">
            {Icon && (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-brand-100 bg-brand-50 shadow-sm dark:border-brand-500/20 dark:bg-brand-500/10">
                <Icon className="h-5 w-5 text-brand-600 dark:text-brand-400" />
              </div>
            )}
            <div className="min-w-0">
              {title && <h3 className="text-headline-sm font-bold text-gray-900 dark:text-white">{title}</h3>}
              {subtitle && <p className="mt-0.5 text-xs font-medium text-gray-500 dark:text-gray-400">{subtitle}</p>}
            </div>
          </div>
          {(toolbar || action) && (
            <div className="flex shrink-0 items-center gap-2">
              {toolbar}
              {action}
            </div>
          )}
        </div>
      )}
      <div className="overflow-x-auto">{children}</div>
    </MagicCard>
  );
}

export const tableHeadRow =
  "bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-[var(--border)]";

/** Use only when the table scroll container supports sticky (no overflow-hidden ancestors). */
export const stickyHeadCell =
  "sticky top-[var(--header-height)] z-20 bg-gray-50 dark:bg-gray-800/95 backdrop-blur supports-[backdrop-filter]:bg-gray-50/95 dark:supports-[backdrop-filter]:bg-gray-800/90";

export const tableHeadCell =
  "px-3 py-3 min-w-[5.5rem] bg-gray-50 text-left align-middle text-[11px] font-semibold uppercase tracking-wide text-gray-600 dark:bg-gray-800/50 dark:text-gray-400 whitespace-nowrap";

export const tableRow =
  "border-b border-gray-200 dark:border-[var(--border)] hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-200 group";
export const tableCell = "px-4 py-3 align-middle transition-colors text-gray-800 dark:text-gray-200";

export function TableToolbar({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("flex items-center justify-end gap-2", className)}>{children}</div>;
}

export function SortableTh({
  label,
  active,
  dir,
  onClick,
  className,
}: {
  label: string;
  active: boolean;
  dir: SortDirection;
  onClick: () => void;
  className?: string;
}) {
  return (
    <th className={cn(tableHeadCell, className)} title={label}>
      <button
        type="button"
        onClick={onClick}
        className="inline-flex max-w-full items-center gap-1 hover:text-gray-900 dark:hover:text-white"
      >
        <span>{label}</span>
        {active ? (
          dir === "asc" ? <ChevronUp className="h-3.5 w-3.5 shrink-0" /> : <ChevronDown className="h-3.5 w-3.5 shrink-0" />
        ) : (
          <span className="inline-block h-3.5 w-3.5 shrink-0 opacity-0 group-hover:opacity-30" />
        )}
      </button>
    </th>
  );
}

export function DataTableHeadRow({
  columns,
  isColumnVisible,
  sortKey,
  sortDir,
  onSort,
  sortableKeys,
  extraHeaders,
}: {
  columns: ColumnDef[];
  isColumnVisible: (key: string) => boolean;
  sortKey: string;
  sortDir: SortDirection;
  onSort: (key: string) => void;
  sortableKeys?: Set<string>;
  extraHeaders?: React.ReactNode;
}) {
  return (
    <tr className={cn(tableHeadRow, "group")}>
      {columns
        .filter((c) => isColumnVisible(c.key))
        .map((col) => {
          const sortable = sortableKeys ? sortableKeys.has(col.key) : col.key !== "actions";
          if (!sortable) {
            return (
              <th key={col.key} className={tableHeadCell} title={col.label}>
                {col.label}
              </th>
            );
          }
          return (
            <SortableTh
              key={col.key}
              label={col.label}
              active={sortKey === col.key}
              dir={sortDir}
              onClick={() => onSort(col.key)}
            />
          );
        })}
      {extraHeaders}
    </tr>
  );
}
