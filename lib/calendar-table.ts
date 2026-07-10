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

type DbRowWithMeta = DbReleaseFilterRow & { priority?: string; impact?: string };

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

function containsInsensitive(haystack: string | null | undefined, needle: string): boolean {
  if (!needle.trim()) return true;
  return (haystack ?? "").toLowerCase().includes(needle.trim().toLowerCase());
}

function inDateBounds(isoDate: string, dateFrom: string, dateTo: string): boolean {
  const t = new Date(isoDate).getTime();
  if (Number.isNaN(t)) return false;
  if (dateFrom) {
    const from = new Date(`${dateFrom}T00:00:00.000Z`).getTime();
    if (!Number.isNaN(from) && t < from) return false;
  }
  if (dateTo) {
    const to = new Date(`${dateTo}T23:59:59.999Z`).getTime();
    if (!Number.isNaN(to) && t > to) return false;
  }
  return true;
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
  },
): CalendarEventApi[] {
  const { period, viewDate, filters, dbRows, bookings, environments, departments } = opts;
  const eventType = filters.eventType?.trim() ?? "";

  return events.filter((ev) => {
    if (!inPeriod(ev.date, period, viewDate)) return false;
    if (eventType && ev.eventType !== eventType) return false;
    if (filters.sizeImpact && (ev.sizeImpact ?? "") !== filters.sizeImpact) return false;
    if (filters.day && calendarDayLabel(new Date(ev.date)) !== filters.day) return false;
    if (!inDateBounds(ev.date, filters.dateFrom, filters.dateTo)) return false;
    if (!containsInsensitive(ev.title, filters.nameQ)) return false;
    if (!containsInsensitive(ev.notes, filters.notesQ)) return false;
    if (filters.releaseCodeQ) {
      const code = ev.release?.releaseCode ?? "";
      if (!containsInsensitive(code, filters.releaseCodeQ)) return false;
    }

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

    // Org-wide events (CHANGE FREEZE with Release ID "-", department "ALL") have no
    // linked release — keep them visible unless status/priority/impact filters apply.
    if (filters.status || filters.priority || filters.impact) return false;
    if (filters.departmentId) {
      const dept = departments.find((d) => d.id === filters.departmentId);
      const name = (ev.departmentName ?? "").trim();
      if (dept?.name && name && name.toUpperCase() !== "ALL" && name !== dept.name) {
        return false;
      }
    }
    // Environment is release/booking-scoped; org-wide freezes have no env link.
    if (filters.environmentId) return false;
    // Application filter: still show org-wide freezes (no app / ALL); hide other
    // unlinked events that aren't org-wide.
    if (filters.applicationId) {
      const name = (ev.departmentName ?? "").trim().toUpperCase();
      if (name !== "ALL") return false;
    }
    // Release ID text search cannot match null-release events
    if (filters.releaseCodeQ.trim()) return false;
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
