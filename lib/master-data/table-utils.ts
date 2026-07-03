export const DEFAULT_PAGE_SIZE = 25;

export type SortDir = "asc" | "desc";

export function filterRows<T extends Record<string, unknown>>(
  rows: T[],
  query: string,
  fields: (keyof T)[]
): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return rows;
  return rows.filter((row) =>
    fields.some((f) => String(row[f] ?? "").toLowerCase().includes(q))
  );
}

export function sortRows<T extends Record<string, unknown>>(
  rows: T[],
  key: keyof T,
  dir: SortDir
): T[] {
  return [...rows].sort((a, b) => {
    const av = String(a[key] ?? "").toLowerCase();
    const bv = String(b[key] ?? "").toLowerCase();
    if (av < bv) return dir === "asc" ? -1 : 1;
    if (av > bv) return dir === "asc" ? 1 : -1;
    return 0;
  });
}

export function paginateRows<T>(rows: T[], page: number, pageSize: number): T[] {
  const start = (page - 1) * pageSize;
  return rows.slice(start, start + pageSize);
}

export function pageCount(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / pageSize));
}
