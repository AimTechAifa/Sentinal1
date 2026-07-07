"use client";

import { Filter } from "lucide-react";
import { SELECT_CLASS } from "@/lib/table-filters";
import { cn } from "@/lib/utils";

export { SELECT_CLASS as filterSelectClass };

export function TableFilterBar({
  children,
  hasActive,
  onClear,
  className,
  trailing,
}: {
  children: React.ReactNode;
  hasActive?: boolean;
  onClear?: () => void;
  className?: string;
  /** Sibling controls (e.g. ColumnPicker) aligned with the filter row */
  trailing?: React.ReactNode;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-4 mb-6", className)}>
      <div className="flex items-center gap-2 text-gray-500 dark:text-white/65">
        <Filter className="h-4 w-4" />
        <span className="text-xs font-bold uppercase tracking-wider">Filter By</span>
      </div>
      {children}
      {hasActive && onClear && (
        <button
          type="button"
          onClick={onClear}
          className="h-9 px-3 text-sm font-medium text-gray-500 dark:text-white/65 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          Clear all filters
        </button>
      )}
      {trailing && <div className="ml-auto flex items-center gap-2">{trailing}</div>}
    </div>
  );
}

export function FilterSelect({
  value,
  onChange,
  disabled,
  children,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={cn(SELECT_CLASS, className)}
    >
      {children}
    </select>
  );
}

export function FilterPills<T extends string>({
  options,
  value,
  onChange,
  allLabel = "All",
}: {
  options: { value: T; label: string }[];
  value: T | "";
  onChange: (value: T | "") => void;
  allLabel?: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => onChange("")}
        className={cn(
          "rounded-lg px-3 py-1.5 text-xs font-medium border transition-colors",
          !value
            ? "bg-brand-500 text-white border-brand-500"
            : "border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-300"
        )}
      >
        {allLabel}
      </button>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-lg px-3 py-1.5 text-xs font-medium border transition-colors",
            value === o.value
              ? "bg-brand-500 text-white border-brand-500"
              : "border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-300"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
