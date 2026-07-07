"use client";

import { useEffect, type ReactNode } from "react";
import { prefetchColumnPreferences } from "@/lib/column-preferences-cache";
import { TABLE_PAGE_KEYS } from "@/lib/table-page-columns";

/** Warm column-preference cache on app load so tables and prefs resolve in parallel. */
export function ColumnPreferencesProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    prefetchColumnPreferences(TABLE_PAGE_KEYS);
  }, []);

  return children;
}
