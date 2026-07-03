"use client";

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
  filtersToSearchParams,
  hasActiveFilters,
  type BookingFilterRow,
  type DbReleaseFilterRow,
  type EnvFilterRow,
  type ReleaseListFilters,
} from "@/lib/release-filters";

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
  calendarEvents: any[]; // We will type this properly below
  setDepartmentId: (id: string) => void;
  setApplicationId: (id: string) => void;
  setEnvironmentId: (id: string) => void;
  clearFilters: () => void;
  filterQuery: string;
  refreshLookups: () => void;
};

const ReleaseFiltersContext = createContext<ReleaseFiltersContextValue | null>(null);

function filtersFromParams(sp: URLSearchParams): ReleaseListFilters {
  return {
    departmentId: sp.get("dept") ?? "",
    applicationId: sp.get("app") ?? "",
    environmentId: sp.get("env") ?? "",
  };
}

export function ReleaseFiltersProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters = useMemo(() => filtersFromParams(searchParams), [searchParams]);

  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [applications, setApplications] = useState<{ id: string; name: string; departmentId: string }[]>([]);
  const [environments, setEnvironments] = useState<EnvFilterRow[]>([]);
  const [bookings, setBookings] = useState<BookingFilterRow[]>([]);
  const [dbRows, setDbRows] = useState<DbReleaseFilterRow[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshLookups = useCallback(() => {
    setLoading(true);
    const fetchJson = async (url: string) => {
      const res = await fetch(url);
      if (!res.ok) {
        console.error(`ReleaseFilters: ${url} failed with ${res.status}`);
        return [];
      }
      const text = await res.text();
      if (!text) return [];
      try {
        return JSON.parse(text);
      } catch {
        console.error(`ReleaseFilters: ${url} returned invalid JSON`);
        return [];
      }
    };
    Promise.all([
      fetchJson("/api/departments"),
      fetchJson("/api/applications"),
      fetchJson("/api/environments"),
      fetchJson("/api/bookings"),
      fetchJson("/api/releases"),
      fetchJson("/api/calendar"),
    ])
      .then(([depts, apps, envs, bks, releases, calEvents]) => {
        setDepartments(depts);
        setApplications(apps);
        setEnvironments(envs);
        setBookings(bks);
        setDbRows(releases);
        setCalendarEvents(calEvents);
      })
      .finally(() => setLoading(false));
  }, []);

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
