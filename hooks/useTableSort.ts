"use client";

import { useCallback } from "react";
import { nextSortDir, readSortFromValues, type SortDirection } from "@/lib/table-sort";
import type { FilterValues } from "@/lib/table-filters";

export function useTableSort(
  values: FilterValues,
  setFilter: (key: string, value: string) => void,
  defaultKey = "",
  defaultDir: SortDirection = "asc"
) {
  const { sortKey, sortDir } = readSortFromValues(values, defaultKey, defaultDir);

  const toggleSort = useCallback(
    (key: string) => {
      if (!key) return;
      if (sortKey === key) {
        setFilter("sortDir", nextSortDir(sortKey, key, sortDir));
        return;
      }
      setFilter("sort", key);
      setFilter("sortDir", "asc");
    },
    [setFilter, sortDir, sortKey]
  );

  return { sortKey, sortDir, toggleSort };
}
