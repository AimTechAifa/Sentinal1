const cache = new Map<string, string[]>();
const inflight = new Map<string, Promise<string[]>>();

export function getCachedHiddenColumns(pageKey: string): string[] | null {
  return cache.get(pageKey) ?? null;
}

export function isColumnPrefsCached(pageKey: string): boolean {
  return cache.has(pageKey);
}

export function setCachedHiddenColumns(pageKey: string, hiddenColumns: string[]) {
  cache.set(pageKey, hiddenColumns);
}

export function fetchColumnPreferences(pageKey: string): Promise<string[]> {
  const cached = cache.get(pageKey);
  if (cached) return Promise.resolve(cached);

  const existing = inflight.get(pageKey);
  if (existing) return existing;

  const promise = fetch(`/api/table-preferences?pageKey=${encodeURIComponent(pageKey)}`)
    .then((res) => (res.ok ? res.json() : { hiddenColumns: [] }))
    .then((data: { hiddenColumns?: string[] }) => {
      const cols = data.hiddenColumns ?? [];
      setCachedHiddenColumns(pageKey, cols);
      inflight.delete(pageKey);
      return cols;
    })
    .catch(() => {
      inflight.delete(pageKey);
      return [];
    });

  inflight.set(pageKey, promise);
  return promise;
}

export function prefetchColumnPreferences(pageKeys: readonly string[]) {
  for (const key of pageKeys) {
    void fetchColumnPreferences(key);
  }
}
