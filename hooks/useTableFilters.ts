"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  buildFilterQueryString,
  hasActiveFilterValues,
  valuesFromSearchParams,
  valuesToSearchParams,
  type FilterSchema,
  type FilterValues,
} from "@/lib/table-filters";

export function useTableFilters(schema: FilterSchema) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const values = useMemo(() => valuesFromSearchParams(searchParams, schema), [searchParams, schema]);

  const hasActive = useMemo(() => hasActiveFilterValues(values), [values]);

  const setFilter = useCallback(
    (key: string, value: string) => {
      const field = schema.find((f) => f.key === key);
      if (!field) return;
      const next: FilterValues = { ...values, [key]: value };
      if (key !== "page" && "page" in next) next.page = "";
      const params = valuesToSearchParams(next, schema, searchParams);
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, schema, searchParams, values]
  );

  const setFilters = useCallback(
    (patch: Partial<FilterValues>) => {
      const next: FilterValues = { ...values };
      for (const [k, v] of Object.entries(patch)) {
        next[k] = v ?? "";
      }
      const params = valuesToSearchParams(next, schema, searchParams);
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, schema, searchParams, values]
  );

  const clearAll = useCallback(() => {
    const cleared: FilterValues = {};
    for (const field of schema) cleared[field.key] = "";
    const params = valuesToSearchParams(cleared, schema, searchParams);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [pathname, router, schema, searchParams]);

  const apiQuery = useMemo(() => buildFilterQueryString(values, schema), [values, schema]);

  const apiUrl = useCallback(
    (basePath: string) => `${basePath}${apiQuery}`,
    [apiQuery]
  );

  return { values, setFilter, setFilters, clearAll, hasActive, apiQuery, apiUrl };
}

/** Fetch a list API whenever URL-driven filters change. */
export function useFilteredFetch<T>(apiPath: string, schema: FilterSchema) {
  const { values, setFilter, setFilters, clearAll, hasActive, apiQuery, apiUrl } = useTableFilters(schema);
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(apiUrl(apiPath))
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`Failed to load (${r.status})`))))
      .then((data) => !cancelled && setRows(data))
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [apiPath, apiUrl]);

  return { rows, loading, error, values, setFilter, setFilters, clearAll, hasActive, apiQuery };
}
