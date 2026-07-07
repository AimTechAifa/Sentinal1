"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  fetchColumnPreferences,
  getCachedHiddenColumns,
  isColumnPrefsCached,
  setCachedHiddenColumns,
} from "@/lib/column-preferences-cache";

export type ColumnDef = {
  key: string;
  label: string;
};

type Options = {
  /** Column keys that cannot be hidden (anchor + actions). Excluded from picker. */
  lockedKeys?: string[];
};

function filterHiddenForPage(saved: string[], hideableKeys: Set<string>) {
  return saved.filter((k) => hideableKeys.has(k));
}

export function useColumnPreferences(pageKey: string, allColumns: ColumnDef[], options: Options = {}) {
  const lockedKeysKey = (options.lockedKeys ?? []).join("\0");
  const lockedSet = useMemo(() => new Set(options.lockedKeys ?? []), [lockedKeysKey]);
  const hideableKeysSig = useMemo(
    () => allColumns.filter((c) => !lockedSet.has(c.key)).map((c) => c.key).join("\0"),
    [allColumns, lockedSet],
  );
  const hideableColumns = useMemo(
    () => allColumns.filter((c) => !lockedSet.has(c.key)),
    [allColumns, lockedSet],
  );

  const hideableKeys = useMemo(
    () => new Set(hideableKeysSig.split("\0").filter(Boolean)),
    [hideableKeysSig],
  );

  const initialHidden = useMemo(() => {
    const cached = getCachedHiddenColumns(pageKey);
    return cached ? filterHiddenForPage(cached, hideableKeys) : [];
  }, [pageKey, hideableKeys]);

  const [hiddenColumns, setHiddenColumns] = useState<string[]>(initialHidden);
  const [loaded, setLoaded] = useState(() => isColumnPrefsCached(pageKey));
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hiddenRef = useRef(hiddenColumns);
  hiddenRef.current = hiddenColumns;

  useEffect(() => {
    let cancelled = false;

    if (isColumnPrefsCached(pageKey)) {
      const cached = getCachedHiddenColumns(pageKey) ?? [];
      setHiddenColumns(filterHiddenForPage(cached, hideableKeys));
      setLoaded(true);
      return;
    }

    setLoaded(false);
    fetchColumnPreferences(pageKey).then((saved) => {
      if (cancelled) return;
      setHiddenColumns(filterHiddenForPage(saved, hideableKeys));
      setLoaded(true);
    });

    return () => {
      cancelled = true;
    };
  }, [pageKey, hideableKeys]);

  const persist = useCallback(
    (nextHidden: string[]) => {
      setCachedHiddenColumns(pageKey, nextHidden);
      fetch("/api/table-preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageKey, hiddenColumns: nextHidden }),
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

  const toggleColumn = useCallback(
    (key: string) => {
      if (lockedSet.has(key)) return;
      setHiddenColumns((prev) => {
        const isHidden = prev.includes(key);
        if (isHidden) {
          const next = prev.filter((k) => k !== key);
          scheduleSave(next);
          return next;
        }
        const visibleHideable = hideableColumns.filter((c) => !prev.includes(c.key));
        if (visibleHideable.length <= 1 && visibleHideable[0]?.key === key) {
          return prev;
        }
        const next = [...prev, key];
        scheduleSave(next);
        return next;
      });
    },
    [hideableColumns, lockedSet, scheduleSave],
  );

  const visibleColumns = useMemo(
    () => allColumns.filter((c) => lockedSet.has(c.key) || !hiddenColumns.includes(c.key)),
    [allColumns, hiddenColumns, lockedSet],
  );

  const isColumnVisible = useCallback(
    (key: string) => lockedSet.has(key) || !hiddenColumns.includes(key),
    [hiddenColumns, lockedSet],
  );

  return {
    visibleColumns,
    hiddenColumns,
    hideableColumns,
    toggleColumn,
    saveNow,
    loaded,
    isColumnVisible,
  };
}
