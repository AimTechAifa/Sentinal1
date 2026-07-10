import { inPeriod, type Period } from "@/lib/period-range";
import type { ReleaseListFilters } from "@/lib/release-filters";

// TODO: Event Type values (CAB MEETING, RELEASE, CHANGE FREEZE, etc.) are a governed set —
// candidate for ReferenceData (same pattern as Drift Type). Not converted in this pass.

export type CalendarEventApi = {
  id: string;
  date: string;
  eventType: string;
  releaseId: string | null;
  title: string;
  applicationName: string | null;
  departmentName: string | null;
  sizeImpact: string | null;
  notes: string | null;
  release?: { releaseCode: string; status: string } | null;
};

export type CalendarTableRow = {
  id: string;
  month: string;
  week: number;
  date: string;
  dateMs: number;
  day: string;
  eventType: string;
  releaseCode: string | null;
  releaseId: string | null;
  releaseName: string;
  application: string;
  department: string;
  sizeImpact: string;
  notes: string;
};

/** Distinct Size/Impact values from the Calendar seed (FY2026–2027). */
export const CALENDAR_SIZE_IMPACT_OPTIONS = [
  "Critical",
  "Large",
  "Large / High",
  "Large / Medium",
  "Medium",
  "Medium / High",
  "Medium / Low",
  "Medium / Medium",
  "Small",
  "Small / Low",
  "Small / Medium",
] as const;

export const CALENDAR_DAY_OPTIONS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

/** Week-of-month counter matching the source Excel Calendar sheet (1–5). */
export function calendarWeekOfMonth(date: Date): number {
  return Math.ceil(date.getDate() / 7);
}

export function calendarMonthLabel(date: Date): string {
  return date.toLocaleString("en-AU", { month: "short", year: "numeric" });
}

export function calendarDayLabel(date: Date): string {
  return date.toLocaleDateString("en-AU", { weekday: "short" });
}

export function mapCalendarEventToTableRow(ev: CalendarEventApi): CalendarTableRow {
  const d = new Date(ev.date);
  return {
    id: ev.id,
    month: calendarMonthLabel(d),
    week: calendarWeekOfMonth(d),
    date: ev.date,
    dateMs: d.getTime(),
    day: calendarDayLabel(d),
    eventType: ev.eventType,
    releaseCode: ev.release?.releaseCode ?? null,
    releaseId: ev.releaseId,
    releaseName: ev.title,
    application: ev.applicationName?.trim() || "—",
    department: ev.departmentName ?? "—",
    sizeImpact: ev.sizeImpact ?? "—",
    notes: ev.notes ?? "",
  };
}

/**
 * Client-side narrow for Calendar views after server `calendarEventWhere`.
 * Only period (navigator) and day-of-week (derived display field) remain client-side.
 */
export function filterCalendarEvents(
  events: CalendarEventApi[],
  opts: {
    period: Period;
    viewDate: Date;
    filters: ReleaseListFilters;
  },
): CalendarEventApi[] {
  const { period, viewDate, filters } = opts;
  const day = filters.day?.trim() ?? "";

  return events.filter((ev) => {
    if (!inPeriod(ev.date, period, viewDate)) return false;
    if (day && calendarDayLabel(new Date(ev.date)) !== day) return false;
    return true;
  });
}

export function sortCalendarTableRows(
  rows: CalendarTableRow[],
  sortKey: string,
  dir: "asc" | "desc"
): CalendarTableRow[] {
  const key = sortKey || "date";
  const accessors: Record<string, (r: CalendarTableRow) => string | number> = {
    month: (r) => r.month,
    week: (r) => r.week,
    date: (r) => r.dateMs,
    day: (r) => r.day,
    eventType: (r) => r.eventType,
    releaseCode: (r) => r.releaseCode ?? "",
    releaseName: (r) => r.releaseName,
    application: (r) => r.application,
    department: (r) => r.department,
    sizeImpact: (r) => r.sizeImpact,
    notes: (r) => r.notes,
  };
  const accessor = accessors[key] ?? accessors.date;
  const mult = dir === "desc" ? -1 : 1;
  return [...rows].sort((a, b) => {
    const av = accessor(a);
    const bv = accessor(b);
    if (av < bv) return -1 * mult;
    if (av > bv) return 1 * mult;
    return 0;
  });
}
