"use client";

import { useEffect, useRef, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { SELECT_CLASS } from "@/lib/table-filters";
import { cn } from "@/lib/utils";
import type { FilterFieldDef } from "@/lib/table-column-types";

type FilterPickerProps = {
  hideableFilters: FilterFieldDef[];
  hiddenFilters: string[];
  toggleFilter: (key: string) => void;
  saveNow: () => void;
  loaded?: boolean;
  className?: string;
};

export function FilterPicker({
  hideableFilters,
  hiddenFilters,
  toggleFilter,
  saveNow,
  loaded = true,
  className,
}: FilterPickerProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        saveNow();
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open, saveNow]);

  const hiddenCount = hiddenFilters.length;

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => {
          if (open) saveNow();
          setOpen((v) => !v);
        }}
        disabled={!loaded}
        className={cn(SELECT_CLASS, "inline-flex items-center gap-2 font-medium disabled:cursor-wait")}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <SlidersHorizontal className="h-4 w-4 shrink-0 text-gray-500 dark:text-white/65" />
        <span>Manage Filters</span>
        {hiddenCount > 0 && (
          <span className="rounded-full bg-brand-100 px-1.5 py-0.5 text-[10px] font-bold text-brand-700 dark:bg-brand-900/40 dark:text-brand-200">
            {hiddenCount} hidden
          </span>
        )}
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute right-0 z-50 mt-1 min-w-[240px] max-h-72 overflow-y-auto rounded-lg border border-gray-200 bg-white py-2 shadow-lg dark:border-[var(--border)] dark:bg-[var(--card)]"
        >
          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/45">
            Show filters
          </p>
          {hideableFilters.map((field) => {
            const visible = !hiddenFilters.includes(field.key);
            const visibleCount = hideableFilters.filter((f) => !hiddenFilters.includes(f.key)).length;
            const isLastVisible = visible && visibleCount <= 1;
            return (
              <label
                key={field.key}
                className={cn(
                  "flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm hover:bg-gray-50 dark:hover:bg-white/5",
                  isLastVisible && "cursor-not-allowed opacity-60"
                )}
              >
                <input
                  type="checkbox"
                  checked={visible}
                  disabled={isLastVisible}
                  onChange={() => toggleFilter(field.key)}
                  className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                />
                <span className="text-gray-700 dark:text-white/90">{field.label}</span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}
