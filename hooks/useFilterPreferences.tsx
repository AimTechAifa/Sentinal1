"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FilterPicker } from "@/components/filters/FilterPicker";
import {
  fetchTablePreferences,
  getCachedTablePreferences,
  isColumnPrefsCached,
  setCachedTablePreferences,
} from "@/lib/column-preferences-cache";
import { EMPTY_TABLE_PREFERENCES } from "@/lib/table-preferences";

import type { FilterFieldDef } from "@/lib/table-column-types";

export type { FilterFieldDef };

function filterHiddenForPage(saved: string[], allowed: Set<string>) {
  return saved.filter((k) => allowed.has(k));
}

export function useFilterPreferences(pageKey: string, allFilters: FilterFieldDef[] = []) {
  const filters = Array.isArray(allFilters) ? allFilters : [];
  const allowedKeys = useMemo(() => new Set(filters.map((f) => f.key)), [filters]);

  const initialHidden = useMemo(() => {
    const cached = getCachedTablePreferences(pageKey);
    return cached ? filterHiddenForPage(cached.hiddenFilters, allowedKeys) : [];
  }, [pageKey, allowedKeys]);

  const [hiddenFilters, setHiddenFilters] = useState<string[]>(initialHidden);
  const [loaded, setLoaded] = useState(() => isColumnPrefsCached(pageKey));
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hiddenRef = useRef(hiddenFilters);
  hiddenRef.current = hiddenFilters;

  useEffect(() => {
    let cancelled = false;

    if (isColumnPrefsCached(pageKey)) {
      const cached = getCachedTablePreferences(pageKey)?.hiddenFilters ?? [];
      setHiddenFilters(filterHiddenForPage(cached, allowedKeys));
      setLoaded(true);
      return;
    }

    setLoaded(false);
    fetchTablePreferences(pageKey).then((prefs) => {
      if (cancelled) return;
      setHiddenFilters(filterHiddenForPage(prefs.hiddenFilters, allowedKeys));
      setLoaded(true);
    });

    return () => {
      cancelled = true;
    };
  }, [pageKey, allowedKeys]);

  const persist = useCallback(
    (nextHidden: string[]) => {
      const cached = getCachedTablePreferences(pageKey) ?? { ...EMPTY_TABLE_PREFERENCES };
      const merged = { ...cached, hiddenFilters: nextHidden };
      setCachedTablePreferences(pageKey, merged);
      fetch("/api/table-preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageKey, hiddenFilters: nextHidden }),
      }).catch(() => {});
    },
    [pageKey],
  );

  const scheduleSave = useCallback(
    (nextHidden: string[]) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => persist(nextHidden), 500);
    },
    [persist],
  );

  const saveNow = useCallback(() => {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
    persist(hiddenRef.current);
  }, [persist]);

  const toggleFilter = useCallback(
    (key: string) => {
      setHiddenFilters((prev) => {
        const isHidden = prev.includes(key);
        const next = isHidden ? prev.filter((k) => k !== key) : [...prev, key];
        scheduleSave(next);
        return next;
      });
    },
    [scheduleSave],
  );

  const isFilterVisible = useCallback((key: string) => !hiddenFilters.includes(key), [hiddenFilters]);

  const hideableFilters = filters;

  const filterPicker = useMemo(
    () => (
      <FilterPicker
        hideableFilters={hideableFilters}
        hiddenFilters={hiddenFilters}
        toggleFilter={toggleFilter}
        saveNow={saveNow}
        loaded={loaded}
      />
    ),
    [hideableFilters, hiddenFilters, toggleFilter, saveNow, loaded]
  );

  return {
    hiddenFilters,
    hideableFilters,
    toggleFilter,
    isFilterVisible,
    saveNow,
    loaded,
    filterPicker,
  };
}
