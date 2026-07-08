"use client";



import { useMemo, useState, useEffect } from "react";

import { ChevronLeft, ChevronRight, LayoutGrid, GanttChartSquare, Table2 } from "lucide-react";

import { MonthGridCalendar } from "@/components/calendar/MonthGridCalendar";

import { ReleaseTimelineView } from "@/components/calendar/ReleaseTimelineView";

import { CalendarTableView } from "@/components/calendar/CalendarTableView";

import { ReleaseFiltersBar } from "@/components/releases/ReleaseFiltersBar";
import { PageDocumentation } from "@/components/help/PageDocumentation";
import { useFilterPreferences } from "@/hooks/useFilterPreferences";
import { useReleaseFilters } from "@/context/ReleaseFiltersContext";
import { RELEASE_FILTER_FIELDS } from "@/lib/table-page-columns";

import {

  periodTitle,

  shiftPeriodAnchor,

} from "@/lib/calendar-schedule";

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

type TabMode = "releases" | "environments";



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

    setTab,

  } = useReleaseFilters();

  const { filterPicker, isFilterVisible } = useFilterPreferences("calendar", RELEASE_FILTER_FIELDS);



  const period = (filters.period || "month") as Period;

  const tab = (filters.tab || "releases") as TabMode;

  const viewDate = useMemo(() => {

    if (filters.anchor) {

      const d = new Date(filters.anchor);

      if (!Number.isNaN(d.getTime())) return d;

    }

    return new Date();

  }, [filters.anchor]);



  const [display, setDisplay] = useState<CalendarDisplay>("calendar");

  const [mounted, setMounted] = useState(false);



  useEffect(() => {

    setMounted(true);

  }, []);



  const { start: periodStart, end: periodEnd } = useMemo(

    () => periodRange(period, viewDate),

    [period, viewDate]

  );



  const filteredEvents = useMemo(() => {

    return filterCalendarEvents(calendarEvents as CalendarEventApi[], {

      period,

      viewDate,

      filters,

      dbRows,

      bookings,

      environments,

      departments,

    });

  }, [calendarEvents, period, viewDate, filters, dbRows, bookings, environments, departments]);



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

      applications

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

    [display, period, viewDate, periodStart, periodEnd]

  );



  if (!mounted) return null;



  return (

    <div className="space-y-6 max-w-7xl mx-auto">

      <ReleaseFiltersBar
        period={period}
        onPeriodChange={(p) => setPeriod(p)}
        showListFilters
        manageFilters={filterPicker}
        isFilterVisible={isFilterVisible}
      />



      <div

        className={cn(

          "bg-white rounded-xl border border-gray-200 shadow-theme-sm dark:bg-[var(--card)] dark:border-[var(--border)]",

          display === "timeline" ? "overflow-visible" : "overflow-hidden"

        )}

      >

        <div className="px-6 pt-6 pb-2">

          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">

            <div className="flex items-center gap-2">

              <div>

                <div className="text-[12px] font-semibold text-slate-400 dark:text-white/45">Release Desk / Calendar</div>

                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Release Calendar</h1>

              </div>

              {display === "calendar" && filteredEvents.length > 0 && (

                <span className="text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full font-semibold dark:bg-brand-900/40 dark:text-brand-200">

                  {filteredEvents.length} events

                </span>

              )}

              {display === "timeline" && timelineReleases.length > 0 && (

                <span className="text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full font-semibold dark:bg-brand-900/40 dark:text-brand-200">

                  {timelineReleases.length} releases

                </span>

              )}

              {display === "table" && filteredEvents.length > 0 && (

                <span className="text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full font-semibold dark:bg-brand-900/40 dark:text-brand-200">

                  {filteredEvents.length} events

                </span>

              )}

            </div>

            <div className="flex items-center gap-2">
              <PageDocumentation pageKey="calendar" />
            <div className="flex items-center gap-1.5 rounded-2xl bg-white p-1.5 shadow-[0_18px_40px_-24px_rgba(112,144,176,0.25)] dark:bg-slate-900/60 dark:shadow-none dark:ring-1 dark:ring-slate-700">

              <button

                type="button"

                onClick={() => setDisplay("calendar")}

                className={cn(

                  "flex items-center gap-1.5 rounded-xl px-4 py-2 text-[13px] font-semibold transition-all",

                  display === "calendar"

                    ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md"

                    : "text-slate-500 hover:bg-slate-50 dark:text-white/60 dark:hover:bg-white/5"

                )}

              >

                <LayoutGrid size={15} /> Calendar

              </button>

              <button

                type="button"

                onClick={() => setDisplay("timeline")}

                className={cn(

                  "flex items-center gap-1.5 rounded-xl px-4 py-2 text-[13px] font-semibold transition-all",

                  display === "timeline"

                    ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md"

                    : "text-slate-500 hover:bg-slate-50 dark:text-white/60 dark:hover:bg-white/5"

                )}

              >

                <GanttChartSquare size={15} /> Timeline

              </button>

              <button

                type="button"

                onClick={() => setDisplay("table")}

                className={cn(

                  "flex items-center gap-1.5 rounded-xl px-4 py-2 text-[13px] font-semibold transition-all",

                  display === "table"

                    ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md"

                    : "text-slate-500 hover:bg-slate-50 dark:text-white/60 dark:hover:bg-white/5"

                )}

              >

                <Table2 size={15} /> Table

              </button>

            </div>
            </div>

          </div>



          <div className="flex items-center justify-center gap-4 mb-6">

            <button

              type="button"

              onClick={prevPeriod}

              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-white/5"

              aria-label="Previous period"

            >

              <ChevronLeft className="h-4 w-4" />

            </button>

            <span className="text-sm font-semibold text-gray-800 dark:text-white min-w-[160px] text-center">

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



          <div className="flex items-center gap-6 border-b border-gray-100 dark:border-slate-700">

            <button

              type="button"

              onClick={() => setTab("releases")}

              className={cn(

                "pb-3 text-xs font-bold tracking-wide uppercase border-b-2 transition-colors",

                tab === "releases"

                  ? "border-brand-500 text-brand-600 dark:text-brand-400"

                  : "border-transparent text-gray-400 hover:text-gray-600"

              )}

            >

              Release Calendar

            </button>

            <button

              type="button"

              onClick={() => setTab("environments")}

              className={cn(

                "pb-3 text-xs font-bold tracking-wide uppercase border-b-2 transition-colors",

                tab === "releases"

                  ? "border-transparent text-gray-400 hover:text-gray-600"

                  : "border-brand-500 text-brand-600 dark:text-brand-400"

              )}

            >

              Environment Bookings

            </button>

          </div>

        </div>



        <div className={cn("p-6 pt-4 bg-gray-50/30 dark:bg-transparent", display === "timeline" && "overflow-visible pt-2")}>

          {display === "calendar" ? (

            <>

              {filteredEvents.length === 0 && calendarEvents.length > 0 && (

                <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-3 py-2 mb-3 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-300">

                  {calendarEvents.length} events loaded — none fall in this period. Navigate to see events.

                </div>

              )}

              {calendarEvents.length === 0 && loading && (

                <div className="text-xs text-gray-400 bg-gray-50 border border-gray-200 rounded px-3 py-2 mb-3 dark:bg-slate-900/40 dark:border-slate-700">

                  Loading calendar events…

                </div>

              )}

              <MonthGridCalendar events={filteredEvents} viewDate={viewDate} />

            </>

          ) : display === "timeline" ? (

            tab === "releases" ? (

              <ReleaseTimelineView

                releases={timelineReleases}

                periodStart={periodStart}

                periodEnd={periodEnd}

              />

            ) : (

              <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500 dark:border-slate-700 dark:bg-[var(--card)] dark:text-white/55">

                Timeline view is available for releases. Switch to the Release Calendar tab.

              </div>

            )

          ) : tab === "releases" ? (

            <CalendarTableView events={filteredEvents} dataLoading={loading} />

          ) : (

            <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500 dark:border-slate-700 dark:bg-[var(--card)] dark:text-white/55">

              Table view is available for releases. Switch to the Release Calendar tab.

            </div>

          )}

        </div>

      </div>

    </div>

  );

}


