import { releases as demoReleases } from "./dummy-data";
import {
  DEMO_TEAM_APPLICATIONS,
  DEMO_TEAM_DEPARTMENT,
  demoReleaseMatchesFilters,
  type UnifiedRelease,
} from "./unified-releases";

export type ReleaseListFilters = {
  departmentId: string;
  applicationId: string;
  environmentId: string;
  status: string;
  priority: string;
  impact: string;
  sort: string;
  sortDir: string;
  period: string;
  anchor: string;
  tab: string;
};

export const EMPTY_RELEASE_FILTERS: ReleaseListFilters = {
  departmentId: "",
  applicationId: "",
  environmentId: "",
  status: "",
  priority: "",
  impact: "",
  sort: "",
  sortDir: "",
  period: "",
  anchor: "",
  tab: "",
};

export function filtersFromSearchParams(sp: URLSearchParams): ReleaseListFilters {
  return {
    departmentId: sp.get("dept") ?? "",
    applicationId: sp.get("app") ?? "",
    environmentId: sp.get("env") ?? "",
    status: sp.get("status") ?? "",
    priority: sp.get("priority") ?? "",
    impact: sp.get("impact") ?? "",
    sort: sp.get("sort") ?? "",
    sortDir: sp.get("dir") ?? sp.get("sortDir") ?? "",
    period: sp.get("period") ?? "",
    anchor: sp.get("anchor") ?? "",
    tab: sp.get("tab") ?? "",
  };
}

const RELEASE_FILTER_PARAMS = ["dept", "app", "env", "status", "priority", "impact", "sort", "dir", "sortDir", "period", "anchor", "tab"] as const;

export function filtersToSearchParams(
  filters: ReleaseListFilters,
  base?: URLSearchParams
): URLSearchParams {
  const params = new URLSearchParams(base?.toString() ?? "");
  for (const key of RELEASE_FILTER_PARAMS) {
    params.delete(key);
  }
  if (filters.departmentId) params.set("dept", filters.departmentId);
  if (filters.applicationId) params.set("app", filters.applicationId);
  if (filters.environmentId) params.set("env", filters.environmentId);
  if (filters.status) params.set("status", filters.status);
  if (filters.priority) params.set("priority", filters.priority);
  if (filters.impact) params.set("impact", filters.impact);
  if (filters.sort) params.set("sort", filters.sort);
  if (filters.sortDir) params.set("dir", filters.sortDir);
  if (filters.period) params.set("period", filters.period);
  if (filters.anchor) params.set("anchor", filters.anchor);
  if (filters.tab) params.set("tab", filters.tab);
  return params;
}

export function filtersQueryString(filters: ReleaseListFilters, leading = "?"): string {
  const params = filtersToSearchParams(filters);
  const s = params.toString();
  if (!s) return "";
  return leading === "?" ? `?${s}` : `&${s}`;
}

export function appendFilterQuery(url: string, filters: ReleaseListFilters): string {
  const hasQuery = url.includes("?");
  const extra = filtersToSearchParams(filters);
  if (!extra.toString()) return url;
  const sep = hasQuery ? "&" : "?";
  return `${url}${sep}${extra.toString()}`;
}

export function hasActiveFilters(filters: ReleaseListFilters): boolean {
  return !!(
    filters.departmentId ||
    filters.applicationId ||
    filters.environmentId ||
    filters.status ||
    filters.priority ||
    filters.impact ||
    filters.period ||
    filters.anchor ||
    filters.tab
  );
}

export type DbReleaseFilterRow = {
  id: string;
  releaseCode: string;
  name: string;
  releaseDate: string;
  status: string;
  departmentId: string;
  applications: { application: { id: string; name: string } }[];
};

export type EnvFilterRow = {
  id: string;
  name: string;
  applicationId: string;
  application: { id: string; name: string };
};

export type BookingFilterRow = {
  releaseId: string | null;
  environmentId: string | null;
  applicationId: string;
};

export function dbReleaseMatchesFilters(
  row: DbReleaseFilterRow,
  filters: ReleaseListFilters,
  bookings: BookingFilterRow[],
  environments: EnvFilterRow[]
): boolean {
  if (filters.departmentId && row.departmentId !== filters.departmentId) return false;

  const appIds = row.applications.map((a) => a.application.id);

  if (filters.applicationId && !appIds.includes(filters.applicationId)) return false;

  if (filters.environmentId) {
    const env = environments.find((e) => e.id === filters.environmentId);
    if (!env) return false;
    const booked = bookings.some(
      (b) => b.releaseId === row.id && b.environmentId === filters.environmentId
    );
    const linkedToApp = appIds.includes(env.applicationId);
    if (!booked && !linkedToApp) return false;
  }

  return true;
}

export function filterDemoReleases(
  filters: ReleaseListFilters,
  departments: { id: string; name: string }[],
  applications: { id: string; name: string }[],
  environments: EnvFilterRow[]
) {
  return demoReleases.filter((r) =>
    demoReleaseMatchesFilters(r, filters, departments, applications, environments)
  );
}

export function filterUnifiedReleases(
  rows: UnifiedRelease[],
  filters: ReleaseListFilters,
  dbRows: DbReleaseFilterRow[],
  bookings: BookingFilterRow[],
  environments: EnvFilterRow[],
  departments: { id: string; name: string }[],
  applications: { id: string; name: string }[]
): UnifiedRelease[] {
  if (!hasActiveFilters(filters)) return rows;

  return rows.filter((r) => {
    if (r.source === "database") {
      const db = dbRows.find((d) => d.id === r.id);
      return db ? dbReleaseMatchesFilters(db, filters, bookings, environments) : false;
    }
    const demo = demoReleases.find((d) => d.id === r.id);
    return demo
      ? demoReleaseMatchesFilters(demo, filters, departments, applications, environments)
      : false;
  });
}

export function filterLabel(
  filters: ReleaseListFilters,
  departments: { id: string; name: string }[],
  applications: { id: string; name: string }[],
  environments: EnvFilterRow[]
): string | null {
  if (!hasActiveFilters(filters)) return null;
  const parts: string[] = [];
  if (filters.departmentId) {
    parts.push(departments.find((d) => d.id === filters.departmentId)?.name ?? "Department");
  }
  if (filters.applicationId) {
    parts.push(applications.find((a) => a.id === filters.applicationId)?.name ?? "Application");
  }
  if (filters.environmentId) {
    const env = environments.find((e) => e.id === filters.environmentId);
    parts.push(env ? `${env.application.name} — ${env.name}` : "Environment");
  }
  return parts.join(" · ");
}

export { DEMO_TEAM_DEPARTMENT, DEMO_TEAM_APPLICATIONS };
