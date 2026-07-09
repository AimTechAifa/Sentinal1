"use client";

import { useAuth } from "@clerk/nextjs";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  EMPTY_RELEASE_FILTERS,
  filtersFromSearchParams,
  filtersToSearchParams,
  hasActiveFilters,
  type BookingFilterRow,
  type DbReleaseFilterRow,
  type EnvFilterRow,
  type ReleaseListFilters,
} from "@/lib/release-filters";
import type { SortDirection } from "@/lib/table-sort";

type ReleaseFiltersContextValue = {
  filters: ReleaseListFilters;
  hasRefinement: boolean;
  loading: boolean;
  departments: { id: string; name: string }[];
  applications: { id: string; name: string; departmentId: string }[];
  environments: EnvFilterRow[];
  envOptions: EnvFilterRow[];
  bookings: BookingFilterRow[];
  dbRows: DbReleaseFilterRow[];
  calendarEvents: any[];
  setDepartmentId: (id: string) => void;
  setApplicationId: (id: string) => void;
  setEnvironmentId: (id: string) => void;
  setStatus: (status: string) => void;
  setPriority: (priority: string) => void;
  setImpact: (impact: string) => void;
  setSort: (sort: string, sortDir?: string) => void;
  toggleSort: (key: string, dir?: SortDirection) => void;
  setPeriod: (period: string) => void;
  setAnchor: (anchor: string) => void;
  setTab: (tab: string) => void;
  clearFilters: () => void;
  filterQuery: string;
  refreshLookups: () => void;
};

const ReleaseFiltersContext = createContext<ReleaseFiltersContextValue | null>(null);

function filtersFromParams(sp: URLSearchParams): ReleaseListFilters {
  return filtersFromSearchParams(sp);
}

export function ReleaseFiltersProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isLoaded, isSignedIn } = useAuth();

  const filters = useMemo(() => filtersFromParams(searchParams), [searchParams]);

  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [applications, setApplications] = useState<{ id: string; name: string; departmentId: string }[]>([]);
  const [environments, setEnvironments] = useState<EnvFilterRow[]>([]);
  const [bookings, setBookings] = useState<BookingFilterRow[]>([]);
  const [dbRows, setDbRows] = useState<DbReleaseFilterRow[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshLookups = useCallback(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const listQs = filtersToSearchParams(filters).toString();
    const url = `/api/release-lookups${listQs ? `?${listQs}` : ""}`;
    fetch(url)
      .then(async (res) => {
        if (!res.ok) {
          console.error(`ReleaseFilters: ${url} failed with ${res.status}`);
          return null;
        }
        const text = await res.text();
        if (!text) return null;
        try {
          return JSON.parse(text) as {
            departments?: { id: string; name: string }[];
            applications?: { id: string; name: string; departmentId: string }[];
            environments?: EnvFilterRow[];
            bookings?: BookingFilterRow[];
            releases?: DbReleaseFilterRow[];
            calendarEvents?: unknown[];
          };
        } catch {
          console.error(`ReleaseFilters: ${url} returned invalid JSON`);
          return null;
        }
      })
      .then((data) => {
        if (!data) return;
        setDepartments(data.departments ?? []);
        setApplications(data.applications ?? []);
        setEnvironments(data.environments ?? []);
        setBookings(data.bookings ?? []);
        setDbRows(data.releases ?? []);
        setCalendarEvents(data.calendarEvents ?? []);
      })
      .finally(() => setLoading(false));
  }, [filters, isLoaded, isSignedIn]);

  useEffect(() => {
    refreshLookups();
  }, [refreshLookups]);

  const pushFilters = useCallback(
    (next: ReleaseListFilters) => {
      const params = filtersToSearchParams(next, new URLSearchParams(searchParams.toString()));
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const setDepartmentId = useCallback(
    (departmentId: string) => pushFilters({ ...filters, departmentId }),
    [filters, pushFilters]
  );

  const setApplicationId = useCallback(
    (applicationId: string) =>
      pushFilters({ ...filters, applicationId, environmentId: "" }),
    [filters, pushFilters]
  );

  const setEnvironmentId = useCallback(
    (environmentId: string) => pushFilters({ ...filters, environmentId }),
    [filters, pushFilters]
  );

  const setStatus = useCallback(
    (status: string) => pushFilters({ ...filters, status }),
    [filters, pushFilters]
  );

  const setPriority = useCallback(
    (priority: string) => pushFilters({ ...filters, priority }),
    [filters, pushFilters]
  );

  const setImpact = useCallback(
    (impact: string) => pushFilters({ ...filters, impact }),
    [filters, pushFilters]
  );

  const setSort = useCallback(
    (sort: string, sortDir?: string) =>
      pushFilters({ ...filters, sort, sortDir: sortDir ?? filters.sortDir }),
    [filters, pushFilters]
  );

  const toggleSort = useCallback(
    (key: string, dir?: SortDirection) => {
      if (!key) return;
      if (dir) {
        pushFilters({ ...filters, sort: key, sortDir: dir });
        return;
      }
      if (filters.sort === key) {
        pushFilters({ ...filters, sortDir: filters.sortDir === "asc" ? "desc" : "asc" });
        return;
      }
      pushFilters({ ...filters, sort: key, sortDir: "asc" });
    },
    [filters, pushFilters]
  );

  const setPeriod = useCallback(
    (period: string) => pushFilters({ ...filters, period }),
    [filters, pushFilters]
  );

  const setAnchor = useCallback(
    (anchor: string) => pushFilters({ ...filters, anchor }),
    [filters, pushFilters]
  );

  const setTab = useCallback(
    (tab: string) => pushFilters({ ...filters, tab }),
    [filters, pushFilters]
  );

  const clearFilters = useCallback(() => pushFilters(EMPTY_RELEASE_FILTERS), [pushFilters]);

  const envOptions = useMemo(() => {
    if (!filters.applicationId) return environments;
    return environments.filter((e) => e.applicationId === filters.applicationId);
  }, [environments, filters.applicationId]);

  const filterQuery = useMemo(() => {
    const p = filtersToSearchParams(filters);
    const s = p.toString();
    return s ? `&${s}` : "";
  }, [filters]);

  const value = useMemo<ReleaseFiltersContextValue>(
    () => ({
      filters,
      hasRefinement: hasActiveFilters(filters),
      loading,
      departments,
      applications,
      environments,
      envOptions,
      bookings,
      dbRows,
      calendarEvents,
      setDepartmentId,
      setApplicationId,
      setEnvironmentId,
      setStatus,
      setPriority,
      setImpact,
      setSort,
      toggleSort,
      setPeriod,
      setAnchor,
      setTab,
      clearFilters,
      filterQuery,
      refreshLookups,
    }),
    [
      filters,
      loading,
      departments,
      applications,
      environments,
      envOptions,
      bookings,
      dbRows,
      calendarEvents,
      setDepartmentId,
      setApplicationId,
      setEnvironmentId,
      setStatus,
      setPriority,
      setImpact,
      setSort,
      toggleSort,
      setPeriod,
      setAnchor,
      setTab,
      clearFilters,
      filterQuery,
      refreshLookups,
    ]
  );

  return (
    <ReleaseFiltersContext.Provider value={value}>{children}</ReleaseFiltersContext.Provider>
  );
}

export function useReleaseFilters() {
  const ctx = useContext(ReleaseFiltersContext);
  if (!ctx) throw new Error("useReleaseFilters must be used within ReleaseFiltersProvider");
  return ctx;
}
