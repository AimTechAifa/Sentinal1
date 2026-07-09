import { inPeriod, type Period } from "@/lib/period-range";
import {
  dbReleaseMatchesFilters,
  type BookingFilterRow,
  type DbReleaseFilterRow,
  type EnvFilterRow,
  type ReleaseListFilters,
} from "@/lib/release-filters";

// TODO: Event Type values (CAB MEETING, RELEASE, CHANGE FREEZE, etc.) are a governed set —
// candidate for ReferenceData (same pattern as Drift Type). Not converted in this pass.

export type CalendarEventApi = {
  id: string;
  date: string;
  eventType: string;
  releaseId: string | null;
  title: string;
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
  department: string;
  sizeImpact: string;
  notes: string;
};

type DbRowWithMeta = DbReleaseFilterRow & { priority?: string; impact?: string };

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
    department: ev.departmentName ?? "—",
    sizeImpact: ev.sizeImpact ?? "—",
    notes: ev.notes ?? "",
  };
}

/** Same filtered event set for Calendar grid, Timeline context, and Table view. */
export function filterCalendarEvents(
  events: CalendarEventApi[],
  opts: {
    period: Period;
    viewDate: Date;
    filters: ReleaseListFilters;
    dbRows: DbRowWithMeta[];
    bookings: BookingFilterRow[];
    environments: EnvFilterRow[];
    departments: { id: string; name: string }[];
    /** Calendar-only event type filter (CAB MEETING, RELEASE, etc.). */
    eventType?: string;
  },
): CalendarEventApi[] {
  const { period, viewDate, filters, dbRows, bookings, environments, departments, eventType } = opts;

  return events.filter((ev) => {
    if (!inPeriod(ev.date, period, viewDate)) return false;
    if (eventType && ev.eventType !== eventType) return false;

    if (ev.releaseId) {
      const db = dbRows.find((r) => r.id === ev.releaseId);
      if (db) {
        if (filters.status && db.status !== filters.status) return false;
        if (filters.priority && db.priority !== filters.priority) return false;
        if (filters.impact && db.impact !== filters.impact) return false;
        if (
          (filters.departmentId || filters.applicationId || filters.environmentId) &&
          !dbReleaseMatchesFilters(db, filters, bookings, environments)
        ) {
          return false;
        }
      }
      return true;
    }

    if (filters.status || filters.priority || filters.impact) return false;
    if (filters.departmentId) {
      const dept = departments.find((d) => d.id === filters.departmentId);
      if (dept?.name && ev.departmentName && ev.departmentName !== dept.name) return false;
    }
    if (filters.applicationId || filters.environmentId) return false;
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
