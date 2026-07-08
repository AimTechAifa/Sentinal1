import type { FilterValues } from "@/lib/table-filters";

export type SortDirection = "asc" | "desc";

export type SortAccessor<T> = (row: T) => string | number | boolean | Date | null | undefined;

export function readSortFromValues(
  values: FilterValues,
  defaultKey = "",
  defaultDir: SortDirection = "asc"
): { sortKey: string; sortDir: SortDirection } {
  const sortKey = values.sort?.trim() ?? "";
  const rawDir = values.sortDir?.trim() || values.dir?.trim() || defaultDir;
  const sortDir: SortDirection = rawDir === "desc" ? "desc" : "asc";
  return {
    sortKey: sortKey || defaultKey,
    sortDir: sortKey ? sortDir : defaultDir,
  };
}

export function nextSortDir(currentKey: string, clickedKey: string, currentDir: SortDirection): SortDirection {
  if (currentKey !== clickedKey) return "asc";
  return currentDir === "asc" ? "desc" : "asc";
}

export function sortRows<T>(
  rows: T[],
  sortKey: string,
  sortDir: SortDirection,
  accessors: Record<string, SortAccessor<T>>
): T[] {
  if (!sortKey || !accessors[sortKey]) return rows;
  const accessor = accessors[sortKey];
  const dir = sortDir === "desc" ? -1 : 1;
  return [...rows].sort((a, b) => {
    const av = normalizeSortValue(accessor(a));
    const bv = normalizeSortValue(accessor(b));
    if (av < bv) return -1 * dir;
    if (av > bv) return 1 * dir;
    return 0;
  });
}

function normalizeSortValue(value: string | number | boolean | Date | null | undefined): string | number {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.getTime();
  if (typeof value === "boolean") return value ? 1 : 0;
  if (typeof value === "number") return value;
  return String(value).toLowerCase();
}
