"use client";

import { useEffect, useMemo, useState } from "react";
import { HeartPulse } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { FilterSelect, TableFilterBar } from "@/components/filters/TableFilterBar";
import { ColumnPicker } from "@/components/filters/ColumnPicker";
import { useColumnPreferences } from "@/hooks/useColumnPreferences";
import { APPLICATION_STATUS_COLUMNS } from "@/lib/table-page-columns";
import { cn, formatDate } from "@/lib/utils";
import { DataTable, tableCell, tableHeadRow, tableRow } from "@/components/ui/data-table";
import { useFilteredFetch } from "@/hooks/useTableFilters";
import { useTablePageLoading } from "@/hooks/useTablePageLoading";
import { TableSkeleton } from "@/components/ui/TableSkeleton";
import { PageDocumentation } from "@/components/help/PageDocumentation";
import { APPLICATION_STATUS_FILTER_SCHEMA } from "@/lib/table-filters";

type StatusRow = {
  id: string;
  application: { id: string; name: string };
  environmentName: string;
  status: string;
  lastCheck: string;
  uptimePercent: number | null;
  notes: string | null;
};

const STATUS_CLASSES: Record<string, string> = {
  Healthy: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300",
  Up: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300",
  Degraded: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300",
  Down: "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300",
};

export default function ApplicationStatusContent() {
  const { rows, loading, values, setFilter, clearAll, hasActive } = useFilteredFetch<StatusRow>(
    "/api/application-status",
    APPLICATION_STATUS_FILTER_SCHEMA
  );
  const [apps, setApps] = useState<{ id: string; name: string }[]>([]);
  const [allRows, setAllRows] = useState<StatusRow[]>([]);

  useEffect(() => {
    fetch("/api/applications").then((r) => (r.ok ? r.json() : [])).then(setApps);
    fetch("/api/application-status").then((r) => (r.ok ? r.json() : [])).then(setAllRows);
  }, []);

  const statuses = useMemo(() => [...new Set(allRows.map((r) => r.status))].sort(), [allRows]);
  const envs = useMemo(() => [...new Set(allRows.map((r) => r.environmentName))].sort(), [allRows]);

  const {
    isColumnVisible,
    hideableColumns,
    hiddenColumns,
    toggleColumn,
    saveNow,
    loaded: columnsLoaded,
  } = useColumnPreferences("application-status", APPLICATION_STATUS_COLUMNS, { lockedKeys: ["application"] });

  const tablePending = useTablePageLoading(loading, columnsLoaded);

  const columnPicker = (
    <ColumnPicker
      hideableColumns={hideableColumns}
      hiddenColumns={hiddenColumns}
      toggleColumn={toggleColumn}
      saveNow={saveNow}
      loaded={columnsLoaded}
    />
  );

  return (
    <div>
      <TopBar
        trailing={<PageDocumentation pageKey="application-status" />}
        title="Application Status" subtitle={`${rows.length} application × environment record${rows.length === 1 ? "" : "s"} — current state snapshot`} />
      {!tablePending && (
        <TableFilterBar hasActive={hasActive} onClear={clearAll} trailing={columnPicker}>
          <FilterSelect value={values.status} onChange={(v) => setFilter("status", v)}>
            <option value="">All statuses</option>
            {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
          </FilterSelect>
          <FilterSelect value={values.environmentName} onChange={(v) => setFilter("environmentName", v)}>
            <option value="">All environments</option>
            {envs.map((e) => <option key={e} value={e}>{e}</option>)}
          </FilterSelect>
          <FilterSelect value={values.applicationId} onChange={(v) => setFilter("applicationId", v)}>
            <option value="">All applications</option>
            {apps.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </FilterSelect>
        </TableFilterBar>
      )}
      {tablePending ? (
        <TableSkeleton columns={APPLICATION_STATUS_COLUMNS.length} />
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-12 text-center">
          <HeartPulse className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">{hasActive ? "No records match the selected filters." : "No application status data recorded."}</p>
        </div>
      ) : (
        <DataTable title="Application Health" subtitle="One row per application × environment" icon={HeartPulse}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className={tableHeadRow}>
                <tr>
                  {isColumnVisible("application") && <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Application</th>}
                  {isColumnVisible("environment") && <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Environment</th>}
                  {isColumnVisible("status") && <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Status</th>}
                  {isColumnVisible("uptimePercent") && <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Uptime %</th>}
                  {isColumnVisible("lastCheck") && <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Last Check</th>}
                  {isColumnVisible("notes") && <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Notes</th>}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className={tableRow}>
                    {isColumnVisible("application") && <td className={`${tableCell} whitespace-nowrap`}>{r.application.name}</td>}
                    {isColumnVisible("environment") && <td className={`${tableCell} whitespace-nowrap`}>{r.environmentName}</td>}
                    {isColumnVisible("status") && (
                    <td className={`${tableCell} whitespace-nowrap`}>
                      <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold", STATUS_CLASSES[r.status] ?? STATUS_CLASSES.Degraded)}>{r.status}</span>
                    </td>
                    )}
                    {isColumnVisible("uptimePercent") && <td className={`${tableCell} whitespace-nowrap`}>{r.uptimePercent != null ? `${(r.uptimePercent * 100).toFixed(1)}%` : "—"}</td>}
                    {isColumnVisible("lastCheck") && <td className={`${tableCell} whitespace-nowrap text-gray-500`}>{formatDate(r.lastCheck)}</td>}
                    {isColumnVisible("notes") && <td className={`${tableCell} truncate max-w-[280px]`} title={r.notes ?? ""}>{r.notes ?? "—"}</td>}
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
