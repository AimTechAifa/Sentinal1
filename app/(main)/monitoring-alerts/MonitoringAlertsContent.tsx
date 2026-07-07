"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { StatusBadge } from "@/components/badges/StatusBadge";
import { FilterSelect, TableFilterBar } from "@/components/filters/TableFilterBar";
import { ColumnPicker } from "@/components/filters/ColumnPicker";
import { useColumnPreferences } from "@/hooks/useColumnPreferences";
import { MONITORING_ALERT_COLUMNS } from "@/lib/table-page-columns";
import { cn, formatDate } from "@/lib/utils";
import { DataTable, tableCell, tableHeadRow, tableRow } from "@/components/ui/data-table";
import { useFilteredFetch } from "@/hooks/useTableFilters";
import { useTablePageLoading } from "@/hooks/useTablePageLoading";
import { TableSkeleton } from "@/components/ui/TableSkeleton";
import { PageDocumentation } from "@/components/help/PageDocumentation";
import { MONITORING_ALERTS_FILTER_SCHEMA } from "@/lib/table-filters";

type AlertRow = {
  id: string;
  alertCode: string;
  timestamp: string;
  application: { id: string; name: string };
  departmentName: string | null;
  alertType: string;
  severity: string;
  metric: string;
  threshold: string | null;
  currentValue: string | null;
  status: string;
  assignedTo: string | null;
  environmentName: string;
};

const SEVERITY_CLASSES: Record<string, string> = {
  Critical: "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300",
  Warning: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300",
  Info: "bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-300",
};

export default function MonitoringAlertsContent() {
  const { rows: alerts, loading, values, setFilter, clearAll, hasActive } = useFilteredFetch<AlertRow>(
    "/api/monitoring-alerts",
    MONITORING_ALERTS_FILTER_SCHEMA
  );
  const [apps, setApps] = useState<{ id: string; name: string }[]>([]);
  const [allAlerts, setAllAlerts] = useState<AlertRow[]>([]);

  useEffect(() => {
    fetch("/api/applications").then((r) => (r.ok ? r.json() : [])).then(setApps);
    fetch("/api/monitoring-alerts").then((r) => (r.ok ? r.json() : [])).then(setAllAlerts);
  }, []);

  const severities = useMemo(() => [...new Set(allAlerts.map((a) => a.severity))].sort(), [allAlerts]);
  const statuses = useMemo(() => [...new Set(allAlerts.map((a) => a.status))].sort(), [allAlerts]);
  const alertTypes = useMemo(() => [...new Set(allAlerts.map((a) => a.alertType))].sort(), [allAlerts]);
  const envs = useMemo(() => [...new Set(allAlerts.map((a) => a.environmentName))].sort(), [allAlerts]);

  const {
    isColumnVisible,
    hideableColumns,
    hiddenColumns,
    toggleColumn,
    saveNow,
    loaded: columnsLoaded,
  } = useColumnPreferences("monitoring-alerts", MONITORING_ALERT_COLUMNS, { lockedKeys: ["alertCode"] });

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
        trailing={<PageDocumentation pageKey="monitoring-alerts" />}
        title="Monitoring Alerts" subtitle={`${alerts.length} alert${alerts.length === 1 ? "" : "s"} across all applications`} />
      {!tablePending && (
        <TableFilterBar hasActive={hasActive} onClear={clearAll} trailing={columnPicker}>
          <FilterSelect value={values.severity} onChange={(v) => setFilter("severity", v)}>
            <option value="">All severities</option>
            {severities.map((s) => <option key={s} value={s}>{s}</option>)}
          </FilterSelect>
          <FilterSelect value={values.status} onChange={(v) => setFilter("status", v)}>
            <option value="">All statuses</option>
            {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
          </FilterSelect>
          <FilterSelect value={values.applicationId} onChange={(v) => setFilter("applicationId", v)}>
            <option value="">All applications</option>
            {apps.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </FilterSelect>
          <FilterSelect value={values.alertType} onChange={(v) => setFilter("alertType", v)}>
            <option value="">All alert types</option>
            {alertTypes.map((t) => <option key={t} value={t}>{t}</option>)}
          </FilterSelect>
          <FilterSelect value={values.environmentName} onChange={(v) => setFilter("environmentName", v)}>
            <option value="">All environments</option>
            {envs.map((e) => <option key={e} value={e}>{e}</option>)}
          </FilterSelect>
        </TableFilterBar>
      )}
      {tablePending ? (
        <TableSkeleton columns={MONITORING_ALERT_COLUMNS.length} />
      ) : alerts.length === 0 ? (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-12 text-center">
          <Bell className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">{hasActive ? "No alerts match the selected filters." : "No monitoring alerts recorded."}</p>
        </div>
      ) : (
        <DataTable title="All Monitoring Alerts" subtitle="Sorted by most recent" icon={Bell}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className={tableHeadRow}>
                <tr>
                  {isColumnVisible("alertCode") && <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Alert</th>}
                  {isColumnVisible("application") && <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Application</th>}
                  {isColumnVisible("severity") && <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Severity</th>}
                  {isColumnVisible("metric") && <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Metric</th>}
                  {isColumnVisible("thresholdVsCurrent") && <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Threshold vs Current</th>}
                  {isColumnVisible("status") && <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Status</th>}
                  {isColumnVisible("assignedTo") && <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Assigned To</th>}
                  {isColumnVisible("environment") && <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Env</th>}
                  {isColumnVisible("timestamp") && <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Timestamp</th>}
                </tr>
              </thead>
              <tbody>
                {alerts.map((a) => (
                  <tr key={a.id} className={tableRow}>
                    {isColumnVisible("alertCode") && (
                    <td className={`${tableCell} whitespace-nowrap`}>
                      <span className="font-mono text-xs text-brand-600 dark:text-brand-400">{a.alertCode}</span>
                      <div className="text-xs text-gray-500 dark:text-white/50">{a.alertType}</div>
                    </td>
                    )}
                    {isColumnVisible("application") && <td className={`${tableCell} whitespace-nowrap`}>{a.application.name}</td>}
                    {isColumnVisible("severity") && (
                    <td className={`${tableCell} whitespace-nowrap`}>
                      <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold", SEVERITY_CLASSES[a.severity] ?? SEVERITY_CLASSES.Info)}>{a.severity}</span>
                    </td>
                    )}
                    {isColumnVisible("metric") && <td className={`${tableCell} whitespace-nowrap`}>{a.metric}</td>}
                    {isColumnVisible("thresholdVsCurrent") && <td className={`${tableCell} whitespace-nowrap text-gray-500`}>{a.threshold ?? "—"} → <span className="text-gray-900 dark:text-white font-medium">{a.currentValue ?? "—"}</span></td>}
                    {isColumnVisible("status") && <td className={`${tableCell} whitespace-nowrap`}><StatusBadge status={a.status} /></td>}
                    {isColumnVisible("assignedTo") && <td className={`${tableCell} whitespace-nowrap`}>{a.assignedTo ?? "—"}</td>}
                    {isColumnVisible("environment") && <td className={`${tableCell} whitespace-nowrap`}>{a.environmentName}</td>}
                    {isColumnVisible("timestamp") && <td className={`${tableCell} whitespace-nowrap text-gray-500`}>{formatDate(a.timestamp)}</td>}
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
