"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpDown, Check } from "lucide-react";
import { SELECT_CLASS } from "@/lib/table-filters";
import type { TableSortPreset } from "@/lib/table-sort-presets";
import type { SortDirection } from "@/lib/table-sort";
import { cn } from "@/lib/utils";

type TableSortPickerProps = {
  presets: TableSortPreset[];
  sortKey: string;
  sortDir: SortDirection;
  onSelect: (sort: string, sortDir: SortDirection) => void;
  className?: string;
};

export function TableSortPicker({ presets, sortKey, sortDir, onSelect, className }: TableSortPickerProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const activePreset = useMemo(
    () => presets.find((p) => p.sort === sortKey && p.sortDir === sortDir),
    [presets, sortKey, sortDir]
  );

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          SELECT_CLASS,
          "inline-flex h-8 max-w-[11rem] items-center gap-1.5 px-2.5 text-xs font-medium"
        )}
        aria-expanded={open}
        aria-haspopup="listbox"
        title="Sort whole table"
      >
        <ArrowUpDown className="h-3.5 w-3.5 shrink-0 text-gray-500 dark:text-white/65" />
        <span className="truncate">{activePreset ? activePreset.label : "Sort"}</span>
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute right-0 z-50 mt-1 min-w-[220px] max-h-72 overflow-y-auto rounded-lg border border-gray-200 bg-white py-2 shadow-lg dark:border-[var(--border)] dark:bg-[var(--card)]"
        >
          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/45">
            Sort table
          </p>
          {presets.map((preset) => {
            const selected = preset.id === activePreset?.id;
            return (
              <button
                key={preset.id}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => {
                  onSelect(preset.sort, preset.sortDir);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-gray-50 dark:hover:bg-white/5",
                  selected && "bg-brand-50/80 text-brand-800 dark:bg-brand-500/10 dark:text-brand-200"
                )}
              >
                <Check className={cn("h-3.5 w-3.5 shrink-0", selected ? "opacity-100" : "opacity-0")} />
                <span className="text-gray-700 dark:text-white/90">{preset.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
