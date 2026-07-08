import { EMPTY_TABLE_PREFERENCES, type TablePreferences } from "@/lib/table-preferences";

const cache = new Map<string, TablePreferences>();
const inflight = new Map<string, Promise<TablePreferences>>();

export function getCachedTablePreferences(pageKey: string): TablePreferences | null {
  return cache.get(pageKey) ?? null;
}

/** @deprecated use getCachedTablePreferences */
export function getCachedHiddenColumns(pageKey: string): string[] | null {
  return cache.get(pageKey)?.hiddenColumns ?? null;
}

export function isColumnPrefsCached(pageKey: string): boolean {
  return cache.has(pageKey);
}

export function setCachedTablePreferences(pageKey: string, prefs: TablePreferences) {
  cache.set(pageKey, prefs);
}

/** @deprecated use setCachedTablePreferences */
export function setCachedHiddenColumns(pageKey: string, hiddenColumns: string[]) {
  const existing = cache.get(pageKey) ?? { ...EMPTY_TABLE_PREFERENCES };
  cache.set(pageKey, { ...existing, hiddenColumns });
}

export function fetchTablePreferences(pageKey: string): Promise<TablePreferences> {
  const cached = cache.get(pageKey);
  if (cached) return Promise.resolve(cached);

  const existing = inflight.get(pageKey);
  if (existing) return existing;

  const promise = fetch(`/api/table-preferences?pageKey=${encodeURIComponent(pageKey)}`)
    .then((res) => (res.ok ? res.json() : EMPTY_TABLE_PREFERENCES))
    .then((data: Partial<TablePreferences>) => {
      const prefs: TablePreferences = {
        hiddenColumns: data.hiddenColumns ?? [],
        hiddenFilters: data.hiddenFilters ?? [],
      };
      setCachedTablePreferences(pageKey, prefs);
      inflight.delete(pageKey);
      return prefs;
    })
    .catch(() => {
      inflight.delete(pageKey);
      return { ...EMPTY_TABLE_PREFERENCES };
    });

  inflight.set(pageKey, promise);
  return promise;
}

/** @deprecated use fetchTablePreferences */
export function fetchColumnPreferences(pageKey: string): Promise<string[]> {
  return fetchTablePreferences(pageKey).then((p) => p.hiddenColumns);
}

export function prefetchColumnPreferences(pageKeys: readonly string[]) {
  for (const key of pageKeys) {
    void fetchTablePreferences(key);
  }
}
