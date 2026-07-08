"use client";

import { SELECT_CLASS } from "@/lib/table-filters";
import { cn } from "@/lib/utils";

export { SELECT_CLASS as filterSelectClass };

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
