"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarClock } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { StatusBadge } from "@/components/badges/StatusBadge";
import { FilterSelect, TableFilterBar } from "@/components/filters/TableFilterBar";
import { ColumnPicker } from "@/components/filters/ColumnPicker";
import { useColumnPreferences } from "@/hooks/useColumnPreferences";
import { PLANNED_MAINTENANCE_COLUMNS } from "@/lib/table-page-columns";
import { formatDate } from "@/lib/utils";
import { DataTable, tableCell, tableHeadRow, tableRow } from "@/components/ui/data-table";
import { useFilteredFetch } from "@/hooks/useTableFilters";
import { useTablePageLoading } from "@/hooks/useTablePageLoading";
import { TableSkeleton } from "@/components/ui/TableSkeleton";
import { PageDocumentation } from "@/components/help/PageDocumentation";
import { PLANNED_MAINTENANCE_FILTER_SCHEMA } from "@/lib/table-filters";

type MaintenanceRow = {
  id: string;
  maintenanceCode: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  type: string;
  application: { id: string; name: string } | null;
  environmentName: string;
  departmentName: string | null;
  impact: string;
  requestor: string | null;
  approvalStatus: string;
  notes: string | null;
};

export default function PlannedMaintenanceContent() {
  const { rows, loading, values, setFilter, clearAll, hasActive } = useFilteredFetch<MaintenanceRow>(
    "/api/planned-maintenance",
    PLANNED_MAINTENANCE_FILTER_SCHEMA
  );
  const [allRows, setAllRows] = useState<MaintenanceRow[]>([]);
  const [apps, setApps] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetch("/api/planned-maintenance").then((r) => (r.ok ? r.json() : [])).then(setAllRows);
    fetch("/api/applications").then((r) => (r.ok ? r.json() : [])).then(setApps);
  }, []);

  const types = useMemo(() => [...new Set(allRows.map((r) => r.type))].sort(), [allRows]);
  const approvals = useMemo(() => [...new Set(allRows.map((r) => r.approvalStatus))].sort(), [allRows]);
  const impacts = useMemo(() => [...new Set(allRows.map((r) => r.impact))].sort(), [allRows]);
  const envs = useMemo(() => [...new Set(allRows.map((r) => r.environmentName))].sort(), [allRows]);

  const {
    isColumnVisible,
    hideableColumns,
    hiddenColumns,
    toggleColumn,
    saveNow,
    loaded: columnsLoaded,
  } = useColumnPreferences("planned-maintenance", PLANNED_MAINTENANCE_COLUMNS, { lockedKeys: ["scheduled"] });

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
        trailing={<PageDocumentation pageKey="planned-maintenance" />}
        title="Planned Maintenance" subtitle={`${rows.length} maintenance window${rows.length === 1 ? "" : "s"} scheduled`} />
      {!tablePending && (
        <TableFilterBar hasActive={hasActive} onClear={clearAll} trailing={columnPicker}>
          <FilterSelect value={values.type} onChange={(v) => setFilter("type", v)}>
            <option value="">All types</option>
            {types.map((t) => <option key={t} value={t}>{t}</option>)}
          </FilterSelect>
          <FilterSelect value={values.approvalStatus} onChange={(v) => setFilter("approvalStatus", v)}>
            <option value="">All approval statuses</option>
            {approvals.map((a) => <option key={a} value={a}>{a}</option>)}
          </FilterSelect>
          <FilterSelect value={values.applicationId} onChange={(v) => setFilter("applicationId", v)}>
            <option value="">All applications</option>
            {apps.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </FilterSelect>
          <FilterSelect value={values.environmentName} onChange={(v) => setFilter("environmentName", v)}>
            <option value="">All environments</option>
            {envs.map((e) => <option key={e} value={e}>{e}</option>)}
          </FilterSelect>
          <FilterSelect value={values.impact} onChange={(v) => setFilter("impact", v)}>
            <option value="">All impacts</option>
            {impacts.map((i) => <option key={i} value={i}>{i}</option>)}
          </FilterSelect>
        </TableFilterBar>
      )}
      {tablePending ? (
        <TableSkeleton columns={PLANNED_MAINTENANCE_COLUMNS.length} />
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-12 text-center">
          <CalendarClock className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">{hasActive ? "No windows match the selected filters." : "No planned maintenance recorded."}</p>
        </div>
      ) : (
        <DataTable title="Maintenance Calendar" subtitle="Sorted by scheduled date" icon={CalendarClock}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className={tableHeadRow}>
                <tr>
                  {isColumnVisible("scheduled") && <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Scheduled</th>}
                  {isColumnVisible("type") && <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Type</th>}
                  {isColumnVisible("application") && <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Application</th>}
                  {isColumnVisible("environment") && <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Env</th>}
                  {isColumnVisible("impact") && <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Impact</th>}
                  {isColumnVisible("approval") && <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Approval</th>}
                  {isColumnVisible("requestor") && <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Requestor</th>}
                  {isColumnVisible("notes") && <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Notes</th>}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className={tableRow}>
                    {isColumnVisible("scheduled") && (
                    <td className={`${tableCell} whitespace-nowrap`}>
                      <span className="font-mono text-xs text-brand-600 dark:text-brand-400">{r.maintenanceCode}</span>
                      <div className="text-xs text-gray-500 dark:text-white/50">{formatDate(r.scheduledDate)} · {r.startTime}–{r.endTime}</div>
                    </td>
                    )}
                    {isColumnVisible("type") && <td className={`${tableCell} whitespace-nowrap`}>{r.type}</td>}
                    {isColumnVisible("application") && <td className={`${tableCell} whitespace-nowrap`}>{r.application?.name ?? "—"}</td>}
                    {isColumnVisible("environment") && <td className={`${tableCell} whitespace-nowrap`}>{r.environmentName}</td>}
                    {isColumnVisible("impact") && <td className={`${tableCell} whitespace-nowrap`}>{r.impact}</td>}
                    {isColumnVisible("approval") && <td className={`${tableCell} whitespace-nowrap`}><StatusBadge status={r.approvalStatus} /></td>}
                    {isColumnVisible("requestor") && <td className={`${tableCell} whitespace-nowrap`}>{r.requestor ?? "—"}</td>}
                    {isColumnVisible("notes") && <td className={`${tableCell} truncate max-w-[240px]`} title={r.notes ?? ""}>{r.notes ?? "—"}</td>}
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
