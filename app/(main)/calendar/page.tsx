"use client";

import { useMemo, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, LayoutGrid, GanttChartSquare, Table2 } from "lucide-react";
import { MonthGridCalendar } from "@/components/calendar/MonthGridCalendar";
import { ReleaseTimelineView } from "@/components/calendar/ReleaseTimelineView";
import { CalendarTableView } from "@/components/calendar/CalendarTableView";
import { CalendarStatusLegend } from "@/components/calendar/CalendarStatusLegend";
import { ReleaseFiltersBar } from "@/components/releases/ReleaseFiltersBar";
import { FilterSelect } from "@/components/filters/TableFilterBar";
import { PageDocumentation } from "@/components/help/PageDocumentation";
import { useFilterPreferences } from "@/hooks/useFilterPreferences";
import { useReleaseFilters } from "@/context/ReleaseFiltersContext";
import { CALENDAR_FILTER_FIELDS } from "@/lib/table-page-columns";
import { periodTitle, shiftPeriodAnchor } from "@/lib/calendar-schedule";
import { filterCalendarEvents, type CalendarEventApi } from "@/lib/calendar-table";
import { inPeriod, periodRange, type Period } from "@/lib/period-range";
import { filterUnifiedReleases } from "@/lib/release-filters";
import { timelineRangeLabel } from "@/lib/release-timeline";
import {
  dbToUnified,
  getDemoReleasesInPeriod,
  mergeReleases,
} from "@/lib/unified-releases";
import { cn } from "@/lib/utils";

type CalendarDisplay = "calendar" | "timeline" | "table";

export default function CalendarPage() {
  const {
    filters,
    loading,
    departments,
    applications,
    environments,
    bookings,
    dbRows,
    calendarEvents,
    setPeriod,
    setAnchor,
  } = useReleaseFilters();

  const { filterPicker, isFilterVisible } = useFilterPreferences("calendar", CALENDAR_FILTER_FIELDS);

  const period = (filters.period || "month") as Period;
  const viewDate = useMemo(() => {
    if (filters.anchor) {
      const d = new Date(filters.anchor);
      if (!Number.isNaN(d.getTime())) return d;
    }
    return new Date();
  }, [filters.anchor]);

  const [display, setDisplay] = useState<CalendarDisplay>("calendar");
  const [mounted, setMounted] = useState(false);
  /** Calendar-only — not part of shared ReleaseFiltersBar. */
  const [eventType, setEventType] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  const { start: periodStart, end: periodEnd } = useMemo(
    () => periodRange(period, viewDate),
    [period, viewDate],
  );

  const eventTypeOptions = useMemo(() => {
    const set = new Set(
      (calendarEvents as CalendarEventApi[])
        .map((e) => e.eventType)
        .filter(Boolean),
    );
    return [...set].sort();
  }, [calendarEvents]);

  const filteredEvents = useMemo(() => {
    return filterCalendarEvents(calendarEvents as CalendarEventApi[], {
      period,
      viewDate,
      filters,
      dbRows,
      bookings,
      environments,
      departments,
      eventType,
    });
  }, [calendarEvents, period, viewDate, filters, dbRows, bookings, environments, departments, eventType]);

  const timelineReleases = useMemo(() => {
    const dbUnified = (dbRows as unknown as Parameters<typeof dbToUnified>[0][]).map(dbToUnified);
    const demoInPeriod = getDemoReleasesInPeriod(period, viewDate);
    const merged = mergeReleases(dbUnified, demoInPeriod);
    const filtered = filterUnifiedReleases(
      merged,
      filters,
      dbRows,
      bookings,
      environments,
      departments,
      applications,
    );
    let rows = filtered.filter((r) => inPeriod(r.date, period, viewDate));
    if (filters.status) rows = rows.filter((r) => r.status === filters.status);
    if (filters.priority) rows = rows.filter((r) => r.priority === filters.priority);
    if (filters.impact) rows = rows.filter((r) => r.impact === filters.impact);
    return rows;
  }, [dbRows, period, viewDate, filters, bookings, environments, departments, applications]);

  const prevPeriod = () => setAnchor(shiftPeriodAnchor(period, viewDate, -1).toISOString().slice(0, 10));
  const nextPeriod = () => setAnchor(shiftPeriodAnchor(period, viewDate, 1).toISOString().slice(0, 10));

  const navLabel = useMemo(
    () =>
      display === "timeline"
        ? timelineRangeLabel(periodStart, periodEnd)
        : periodTitle(period, viewDate),
    [display, period, viewDate, periodStart, periodEnd],
  );

  const countBadge =
    display === "timeline"
      ? timelineReleases.length > 0
        ? `${timelineReleases.length} releases`
        : null
      : filteredEvents.length > 0
        ? `${filteredEvents.length} events`
        : null;

  if (!mounted) return null;

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      {/* One connected control cluster: filters + view/nav */}
      <section
        className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-theme-sm dark:border-[var(--border)] dark:bg-[var(--card)]"
        aria-label="Calendar controls"
      >
        <ReleaseFiltersBar
          className="mb-0 rounded-none border-0 border-b border-gray-100 shadow-none dark:border-slate-700"
          period={period}
          onPeriodChange={(p) => setPeriod(p)}
          showListFilters
          manageFilters={filterPicker}
          isFilterVisible={isFilterVisible}
        >
          {/* B1: Calendar-only Event Type — not on shared bar defaults */}
          <FilterSelect value={eventType} onChange={setEventType}>
            <option value="">All event types</option>
            {eventTypeOptions.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </FilterSelect>
        </ReleaseFiltersBar>

        <div className="px-5 pb-4 pt-4">
          <div className="mb-3 flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Release Calendar</h1>
                {countBadge && (
                  <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-700 dark:bg-brand-900/40 dark:text-brand-200">
                    {countBadge}
                  </span>
                )}
              </div>
              <CalendarStatusLegend className="mt-2.5" />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <PageDocumentation pageKey="calendar" />
              <div className="flex items-center gap-1.5 rounded-2xl bg-slate-50 p-1.5 dark:bg-slate-900/60 dark:ring-1 dark:ring-slate-700">
                {(
                  [
                    { id: "calendar" as const, label: "Calendar", Icon: LayoutGrid },
                    { id: "timeline" as const, label: "Timeline", Icon: GanttChartSquare },
                    { id: "table" as const, label: "Table", Icon: Table2 },
                  ] as const
                ).map(({ id, label, Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setDisplay(id)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-xl px-4 py-2 text-[13px] font-semibold transition-all",
                      display === id
                        ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md"
                        : "text-slate-500 hover:bg-white dark:text-white/60 dark:hover:bg-white/5",
                    )}
                  >
                    <Icon size={15} /> {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* A3: keep ◀ ▶ as window shifter; period dropdown above remains grain control */}
          <div className="mb-1 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={prevPeriod}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-white/5"
              aria-label="Previous period"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="min-w-[160px] text-center text-sm font-semibold text-gray-800 dark:text-white">
              {navLabel}
            </span>
            <button
              type="button"
              onClick={nextPeriod}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-white/5"
              aria-label="Next period"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div
          className={cn(
            "bg-gray-50/30 p-6 pt-4 dark:bg-transparent",
            display === "timeline" && "overflow-visible pt-2",
          )}
        >
          {display === "calendar" ? (
            <>
              {filteredEvents.length === 0 && calendarEvents.length > 0 && (
                <div className="mb-3 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-600 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
                  {calendarEvents.length} events loaded — none match this period/filters. Adjust filters or navigate.
                </div>
              )}
              {calendarEvents.length === 0 && loading && (
                <div className="mb-3 rounded border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-400 dark:border-slate-700 dark:bg-slate-900/40">
                  Loading calendar events…
                </div>
              )}
              <MonthGridCalendar events={filteredEvents} viewDate={viewDate} />
            </>
          ) : display === "timeline" ? (
            <ReleaseTimelineView
              releases={timelineReleases}
              periodStart={periodStart}
              periodEnd={periodEnd}
              period={period}
            />
          ) : (
            <CalendarTableView events={filteredEvents} dataLoading={loading} />
          )}
        </div>
      </section>
    </div>
  );
}
