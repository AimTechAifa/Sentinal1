"use client";

import { useEffect, useRef, useState } from "react";
import { Columns3 } from "lucide-react";
import { SELECT_CLASS } from "@/lib/table-filters";
import { cn } from "@/lib/utils";
import type { ColumnDef } from "@/hooks/useColumnPreferences";

type ColumnPickerProps = {
  hideableColumns: ColumnDef[];
  hiddenColumns: string[];
  toggleColumn: (key: string) => void;
  saveNow: () => void;
  loaded?: boolean;
  className?: string;
};

export function ColumnPicker({
  hideableColumns,
  hiddenColumns,
  toggleColumn,
  saveNow,
  loaded = true,
  className,
}: ColumnPickerProps) {
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

  const visibleHideableCount = hideableColumns.filter((c) => !hiddenColumns.includes(c.key)).length;
  const hiddenCount = hiddenColumns.length;

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => {
          if (open) saveNow();
          setOpen((v) => !v);
        }}
        disabled={!loaded}
        className={cn(
          SELECT_CLASS,
          "inline-flex items-center gap-2 font-medium disabled:cursor-wait",
        )}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <Columns3 className="h-4 w-4 shrink-0 text-gray-500 dark:text-white/65" />
        <span>Columns</span>
        {hiddenCount > 0 && (
          <span className="rounded-full bg-brand-100 px-1.5 py-0.5 text-[10px] font-bold text-brand-700 dark:bg-brand-900/40 dark:text-brand-200">
            {hiddenCount} hidden
          </span>
        )}
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute right-0 z-50 mt-1 min-w-[220px] max-h-72 overflow-y-auto rounded-lg border border-gray-200 dark:border-[var(--border)] bg-white dark:bg-[var(--card)] py-2 shadow-lg"
        >
          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/45">
            Show columns
          </p>
          {hideableColumns.map((col) => {
            const visible = !hiddenColumns.includes(col.key);
            const isLastVisible = visible && visibleHideableCount <= 1;
            return (
              <label
                key={col.key}
                className={cn(
                  "flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm hover:bg-gray-50 dark:hover:bg-white/5",
                  isLastVisible && "cursor-not-allowed opacity-60",
                )}
              >
                <input
                  type="checkbox"
                  checked={visible}
                  disabled={isLastVisible}
                  onChange={() => toggleColumn(col.key)}
                  className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                />
                <span className="text-gray-700 dark:text-white/90">{col.label}</span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}
