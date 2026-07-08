"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { ProgressLink } from "@/components/layout/NavigationProgress";
import { TableFilterBar } from "@/components/filters/TableFilterBar";
import { DataTable, TableToolbar, tableCell, tableHeadRow, tableRow } from "@/components/ui/data-table";
import { TableSkeleton } from "@/components/ui/TableSkeleton";
import { useTablePagePreferences } from "@/hooks/useTablePagePreferences";
import { useTablePageLoading } from "@/hooks/useTablePageLoading";
import {
  mapCalendarEventToTableRow,
  sortCalendarTableRows,
  type CalendarEventApi,
} from "@/lib/calendar-table";
import { DEFAULT_PAGE_SIZE, pageCount, paginateRows } from "@/lib/master-data/table-utils";
import { CALENDAR_TABLE_COLUMNS, CALENDAR_TABLE_FILTER_FIELDS } from "@/lib/table-page-columns";
import { cn, formatDate } from "@/lib/utils";

const PAGE_SIZE = DEFAULT_PAGE_SIZE;

export function CalendarTableView({
  events,
  dataLoading,
}: {
  events: CalendarEventApi[];
  dataLoading: boolean;
}) {
  const [page, setPage] = useState(1);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const { isColumnVisible, columnPicker, prefsLoaded } = useTablePagePreferences(
    "calendar-table",
    CALENDAR_TABLE_COLUMNS,
    CALENDAR_TABLE_FILTER_FIELDS,
    { lockedKeys: ["date"] }
  );

  const tablePending = useTablePageLoading(dataLoading, prefsLoaded);

  useEffect(() => {
    setPage(1);
  }, [events.length, sortDir]);

  const rows = useMemo(() => {
    const mapped = events.map(mapCalendarEventToTableRow);
    return sortCalendarTableRows(mapped, sortDir);
  }, [events, sortDir]);

  const totalPages = pageCount(rows.length, PAGE_SIZE);
  const safePage = Math.min(page, totalPages);
  const pageRows = paginateRows(rows, safePage, PAGE_SIZE);
  const from = rows.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const to = Math.min(safePage * PAGE_SIZE, rows.length);

  const toggleDateSort = () => {
    setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    setPage(1);
  };

  return (
    <div className="space-y-4">
      {!tablePending && (
        <TableFilterBar hasActive={false}>
          <span className="text-xs font-medium text-gray-500 dark:text-white/50">
            {rows.length} event{rows.length === 1 ? "" : "s"}
          </span>
        </TableFilterBar>
      )}

      {tablePending ? (
        <TableSkeleton columns={CALENDAR_TABLE_COLUMNS.length} rows={8} showFilterBar={false} />
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center dark:border-slate-700 dark:bg-[var(--card)]">
          <CalendarDays className="mx-auto mb-3 h-10 w-10 text-gray-300 dark:text-gray-600" />
          <p className="text-gray-500 dark:text-white/55">No calendar events match the current filters in this period.</p>
        </div>
      ) : (
        <DataTable
          title="Calendar Events"
          subtitle="CAB meetings, releases, and governance dates — sorted by date"
          icon={CalendarDays}
          toolbar={<TableToolbar>{columnPicker}</TableToolbar>}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 px-6 py-3 text-[13px] text-gray-600 dark:border-gray-700 dark:text-white/55">
            <span>
              Showing {from}–{to} of {rows.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold disabled:opacity-40 dark:border-gray-600"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Previous
              </button>
              <span className="text-xs font-medium">
                Page {safePage} of {totalPages}
              </span>
              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold disabled:opacity-40 dark:border-gray-600"
              >
                Next <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-sm">
              <thead className={tableHeadRow}>
                <tr>
                  {isColumnVisible("month") && (
                    <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Month</th>
                  )}
                  {isColumnVisible("week") && (
                    <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Week</th>
                  )}
                  {isColumnVisible("date") && (
                    <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>
                      <button
                        type="button"
                        onClick={toggleDateSort}
                        className="inline-flex items-center gap-1 hover:text-brand-600 dark:hover:text-brand-400"
                      >
                        Date
                        <span className="text-[10px] text-gray-400">{sortDir === "asc" ? "↑" : "↓"}</span>
                      </button>
                    </th>
                  )}
                  {isColumnVisible("day") && (
                    <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Day</th>
                  )}
                  {isColumnVisible("eventType") && (
                    <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Event Type</th>
                  )}
                  {isColumnVisible("releaseCode") && (
                    <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Release ID</th>
                  )}
                  {isColumnVisible("releaseName") && (
                    <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Release Name</th>
                  )}
                  {isColumnVisible("department") && (
                    <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Department</th>
                  )}
                  {isColumnVisible("sizeImpact") && (
                    <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Size/Impact</th>
                  )}
                  {isColumnVisible("notes") && (
                    <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Notes</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {pageRows.map((row) => (
                  <tr key={row.id} className={tableRow}>
                    {isColumnVisible("month") && (
                      <td className={`${tableCell} whitespace-nowrap text-gray-600 dark:text-white/70`}>{row.month}</td>
                    )}
                    {isColumnVisible("week") && (
                      <td className={`${tableCell} whitespace-nowrap text-gray-600 dark:text-white/70`}>{row.week}</td>
                    )}
                    {isColumnVisible("date") && (
                      <td className={`${tableCell} whitespace-nowrap font-medium`}>{formatDate(row.date)}</td>
                    )}
                    {isColumnVisible("day") && (
                      <td className={`${tableCell} whitespace-nowrap text-gray-600 dark:text-white/70`}>{row.day}</td>
                    )}
                    {isColumnVisible("eventType") && (
                      <td className={`${tableCell} whitespace-nowrap`}>
                        <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-slate-700 dark:bg-white/10 dark:text-white/80">
                          {row.eventType}
                        </span>
                      </td>
                    )}
                    {isColumnVisible("releaseCode") && (
                      <td className={`${tableCell} whitespace-nowrap`}>
                        {row.releaseId && row.releaseCode ? (
                          <ProgressLink
                            href={`/releases/${row.releaseId}`}
                            className="font-mono text-xs text-brand-600 hover:underline dark:text-brand-400"
                          >
                            {row.releaseCode}
                          </ProgressLink>
                        ) : (
                          "—"
                        )}
                      </td>
                    )}
                    {isColumnVisible("releaseName") && (
                      <td className={cn(tableCell, "max-w-[280px] truncate")} title={row.releaseName}>
                        {row.releaseName}
                      </td>
                    )}
                    {isColumnVisible("department") && (
                      <td className={`${tableCell} whitespace-nowrap`}>{row.department}</td>
                    )}
                    {isColumnVisible("sizeImpact") && (
                      <td className={`${tableCell} whitespace-nowrap text-gray-600 dark:text-white/70`}>
                        {row.sizeImpact}
                      </td>
                    )}
                    {isColumnVisible("notes") && (
                      <td className={cn(tableCell, "max-w-[320px] truncate text-gray-600 dark:text-white/60")} title={row.notes}>
                        {row.notes || "—"}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DataTable>
      )}
    </div>
  );
}
