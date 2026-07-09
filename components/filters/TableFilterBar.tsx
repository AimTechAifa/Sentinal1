"use client";

import { Filter } from "lucide-react";
import { cn } from "@/lib/utils";

export function TableFilterBar({
  children,
  hasActive,
  onClear,
  className,
  manageFilters,
}: {
  children: React.ReactNode;
  hasActive?: boolean;
  onClear?: () => void;
  className?: string;
  /** Manage Filters picker — shown in the filter card header */
  manageFilters?: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "mb-5 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-[var(--border)] dark:bg-[var(--card)]",
        className
      )}
      aria-label="Filters"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-gray-600 dark:text-white/70">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
            <Filter className="h-4 w-4" />
          </span>
          <span className="text-sm font-semibold text-gray-800 dark:text-white">Filters</span>
        </div>
        <div className="flex items-center gap-2">
          {hasActive && onClear && (
            <button
              type="button"
              onClick={onClear}
              className="h-9 px-3 text-sm font-medium text-gray-500 transition-colors hover:text-gray-900 dark:text-white/65 dark:hover:text-white"
            >
              Clear all filters
            </button>
          )}
          {manageFilters}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </section>
  );
}

export {
  FilterSelect,
  FilterPills,
  FilterTextInput,
  FilterRangeInputs,
  FilterTriState,
  FilterSearchableSelect,
  filterSelectClass,
} from "@/components/filters/TableFilterControls";
