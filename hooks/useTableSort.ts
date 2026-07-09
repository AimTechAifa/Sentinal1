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
    (key: string, dir?: SortDirection) => {
      if (!key) return;
      if (dir) {
        setFilter("sort", key);
        setFilter("sortDir", dir);
        return;
      }
      if (sortKey === key) {
        setFilter("sortDir", nextSortDir(sortKey, key, sortDir));
        return;
      }
      setFilter("sort", key);
      setFilter("sortDir", "asc");
    },
    [setFilter, sortDir, sortKey]
  );

  const setSort = useCallback(
    (sort: string, dir: SortDirection) => {
      setFilter("sort", sort);
      setFilter("sortDir", dir);
    },
    [setFilter]
  );

  return { sortKey, sortDir, toggleSort, setSort };
}
