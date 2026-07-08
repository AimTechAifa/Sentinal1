/**
 * URL-driven table filter utilities shared across list pages.
 * Release-family pages (releases, calendar) use ReleaseFiltersContext instead,
 * but reuse param names defined here where they overlap (dept/app/env).
 */

export type FilterFieldDef = {
  /** Internal key used in hook state */
  key: string;
  /** URL query parameter name */
  param: string;
};

export type FilterSchema = FilterFieldDef[];

export type FilterValues = Record<string, string>;

export function valuesFromSearchParams(sp: URLSearchParams, schema: FilterSchema): FilterValues {
  const values: FilterValues = {};
  for (const field of schema) {
    values[field.key] = sp.get(field.param) ?? "";
  }
  // Support both ?dir= and legacy ?sortDir=
  if (!values.sortDir && sp.get("sortDir")) {
    values.sortDir = sp.get("sortDir") ?? "";
  }
  return values;
}

/** Merge filter values into URL params; only touches keys owned by schema. */
export function valuesToSearchParams(
  values: FilterValues,
  schema: FilterSchema,
  base?: URLSearchParams
): URLSearchParams {
  const params = new URLSearchParams(base?.toString() ?? "");
  for (const field of schema) {
    params.delete(field.param);
    const v = values[field.key]?.trim();
    if (v) params.set(field.param, v);
  }
  return params;
}

export function hasActiveFilterValues(values: FilterValues): boolean {
  return Object.entries(values).some(([k, v]) => v.trim() !== "" && k !== "sort" && k !== "sortDir" && k !== "dir");
}

export const TABLE_SORT_SCHEMA: FilterSchema = [
  { key: "sort", param: "sort" },
  { key: "sortDir", param: "dir" },
];

export function withTableSort(schema: FilterSchema): FilterSchema {
  const keys = new Set(schema.map((f) => f.key));
  const merged = [...schema];
  for (const field of TABLE_SORT_SCHEMA) {
    if (!keys.has(field.key)) merged.push(field);
  }
  return merged;
}

export function buildFilterQueryString(values: FilterValues, schema: FilterSchema): string {
  const params = valuesToSearchParams(values, schema);
  const s = params.toString();
  return s ? `?${s}` : "";
}

export function appendFilterValuesToUrl(url: string, values: FilterValues, schema: FilterSchema): string {
  const extra = valuesToSearchParams(values, schema);
  if (!extra.toString()) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}${extra.toString()}`;
}

/** Shared param names — same as ReleaseFiltersContext */
export const SHARED_DEPT_PARAM = "dept";
export const SHARED_APP_PARAM = "app";
export const SHARED_ENV_PARAM = "env";

export const SELECT_CLASS =
  "h-9 rounded-lg border border-gray-300 dark:border-[var(--border)] bg-white dark:bg-[var(--card)] px-3 py-1 text-sm text-gray-700 dark:text-white shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:opacity-50";

// --- Per-page filter schemas (param names are the URL contract) ---

export const DEPENDENCIES_FILTER_SCHEMA: FilterSchema = withTableSort([
  { key: "status", param: "status" },
  { key: "dependencyType", param: "type" },
  { key: "impact", param: "impact" },
]);

export const CONFLICTS_FILTER_SCHEMA: FilterSchema = withTableSort([
  { key: "departmentId", param: "dept" },
  { key: "applicationId", param: "app" },
  { key: "status", param: "status" },
  { key: "priority", param: "priority" },
]);

export const BOOKING_FILTER_SCHEMA: FilterSchema = withTableSort([
  { key: "departmentId", param: "dept" },
  { key: "applicationId", param: "app" },
  { key: "environmentId", param: "env" },
  { key: "releaseId", param: "release" },
  { key: "conflictFlag", param: "conflict" },
]);

export const APPROVALS_FILTER_SCHEMA: FilterSchema = withTableSort([
  { key: "decision", param: "decision" },
  { key: "approvalType", param: "type" },
  { key: "approverId", param: "approver" },
  { key: "releaseId", param: "release" },
]);

export const LEAVES_FILTER_SCHEMA: FilterSchema = withTableSort([
  { key: "leaveType", param: "type" },
  { key: "department", param: "dept" },
  { key: "riskLevel", param: "risk" },
]);

export const INCIDENTS_FILTER_SCHEMA: FilterSchema = withTableSort([
  { key: "severity", param: "severity" },
  { key: "status", param: "status" },
  { key: "applicationId", param: "app" },
  { key: "departmentName", param: "dept" },
  { key: "environmentName", param: "env" },
]);

export const MONITORING_ALERTS_FILTER_SCHEMA: FilterSchema = withTableSort([
  { key: "severity", param: "severity" },
  { key: "status", param: "status" },
  { key: "applicationId", param: "app" },
  { key: "departmentName", param: "dept" },
  { key: "environmentName", param: "env" },
  { key: "alertType", param: "alertType" },
]);

export const APPLICATION_STATUS_FILTER_SCHEMA: FilterSchema = withTableSort([
  { key: "status", param: "status" },
  { key: "environmentName", param: "env" },
  { key: "applicationId", param: "app" },
  { key: "departmentName", param: "dept" },
]);

export const PLANNED_MAINTENANCE_FILTER_SCHEMA: FilterSchema = withTableSort([
  { key: "type", param: "type" },
  { key: "approvalStatus", param: "approvalStatus" },
  { key: "applicationId", param: "app" },
  { key: "departmentName", param: "dept" },
  { key: "environmentName", param: "env" },
  { key: "impact", param: "impact" },
]);

export const RISKS_FILTER_SCHEMA: FilterSchema = withTableSort([
  { key: "status", param: "status" },
  { key: "category", param: "category" },
  { key: "riskOwnerId", param: "owner" },
  { key: "releaseId", param: "release" },
]);

export const DRIFTS_FILTER_SCHEMA: FilterSchema = withTableSort([
  { key: "driftType", param: "driftType" },
  { key: "severity", param: "severity" },
  { key: "status", param: "status" },
  { key: "applicationId", param: "app" },
  { key: "releaseId", param: "release" },
]);

export const RISK_FACTORS_FILTER_SCHEMA: FilterSchema = [
  { key: "q", param: "q" },
  { key: "category", param: "category" },
  { key: "active", param: "active" },
  { key: "sort", param: "sort" },
  { key: "sortDir", param: "sortDir" },
  { key: "page", param: "page" },
];

export const DEPARTMENTS_FILTER_SCHEMA: FilterSchema = [
  { key: "q", param: "q" },
  { key: "sort", param: "sort" },
  { key: "sortDir", param: "sortDir" },
  { key: "page", param: "page" },
];

export const APPLICATIONS_FILTER_SCHEMA: FilterSchema = [
  { key: "q", param: "q" },
  { key: "departmentId", param: "dept" },
  { key: "criticality", param: "criticality" },
  { key: "type", param: "type" },
  { key: "manageApp", param: "manageApp" },
  { key: "sort", param: "sort" },
  { key: "sortDir", param: "sortDir" },
  { key: "page", param: "page" },
];

export const USERS_FILTER_SCHEMA: FilterSchema = [
  { key: "q", param: "q" },
  { key: "department", param: "dept" },
  { key: "role", param: "role" },
  { key: "accessLevel", param: "access" },
  { key: "status", param: "status" },
  { key: "sort", param: "sort" },
  { key: "sortDir", param: "sortDir" },
  { key: "page", param: "page" },
];

export const ENVIRONMENTS_FILTER_SCHEMA: FilterSchema = withTableSort([
  { key: "applicationId", param: "app" },
]);

export const REFERENCE_DATA_FILTER_SCHEMA: FilterSchema = [
  { key: "category", param: "cat" },
  { key: "active", param: "active" },
];

export const SYSTEM_MAPPING_FILTER_SCHEMA: FilterSchema = [
  { key: "groupId", param: "group" },
];
