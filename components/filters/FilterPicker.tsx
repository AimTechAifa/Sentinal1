"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { SELECT_CLASS } from "@/lib/table-filters";
import { cn } from "@/lib/utils";
import { MANAGE_PANEL_SEARCH_THRESHOLD, type FilterFieldDef } from "@/lib/table-column-types";

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
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const showSearch = hideableFilters.length > MANAGE_PANEL_SEARCH_THRESHOLD;

  useEffect(() => {
    if (!open) {
      setQuery("");
      return;
    }
    const onPointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        saveNow();
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open, saveNow]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return hideableFilters;
    return hideableFilters.filter(
      (f) => f.label.toLowerCase().includes(needle) || f.key.toLowerCase().includes(needle),
    );
  }, [hideableFilters, query]);

  const visibleCount = hideableFilters.filter((f) => !hiddenFilters.includes(f.key)).length;
  const hiddenCount = hiddenFilters.length;

  const close = () => {
    setOpen(false);
    saveNow();
  };

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => {
          if (open) close();
          else setOpen(true);
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
          className="absolute right-0 z-50 mt-1 flex w-[min(100vw-1.5rem,16rem)] min-w-[12rem] max-h-72 flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg dark:border-[var(--border)] dark:bg-[var(--card)]"
        >
          <p className="shrink-0 px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/45">
            Show filters
          </p>
          {showSearch && (
            <div className="shrink-0 border-b border-gray-100 px-2 pb-2 dark:border-white/10">
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search filters…"
                aria-label="Search filters"
                className={cn(SELECT_CLASS, "h-8 w-full px-2 text-xs")}
                autoFocus
              />
            </div>
          )}
          <div className="min-h-0 flex-1 overflow-y-auto py-1">
            {filtered.map((field) => {
              const visible = !hiddenFilters.includes(field.key);
              const isLastVisible = visible && visibleCount <= 1;
              return (
                <label
                  key={field.key}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm hover:bg-gray-50 dark:hover:bg-white/5",
                    isLastVisible && "cursor-not-allowed opacity-60",
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
            {filtered.length === 0 && (
              <p className="px-3 py-2 text-xs text-gray-400 dark:text-white/45">No matching filters</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
