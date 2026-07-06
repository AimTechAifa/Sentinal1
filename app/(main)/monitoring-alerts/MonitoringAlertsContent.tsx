"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Filter, Bell } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { StatusBadge } from "@/components/badges/StatusBadge";
import { cn, formatDate } from "@/lib/utils";
import { DataTable, tableCell, tableHeadRow, tableRow } from "@/components/ui/data-table";

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

const selectClass =
  "h-9 rounded-lg border border-gray-300 dark:border-[var(--border)] bg-white dark:bg-[var(--card)] px-3 py-1 text-sm text-gray-700 dark:text-white shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:opacity-50";

export default function MonitoringAlertsContent() {
  const searchParams = useSearchParams();
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState(searchParams.get("severity") ?? "");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") ?? "");
  const [appFilter, setAppFilter] = useState(searchParams.get("app") ?? "");

  useEffect(() => {
    fetch("/api/monitoring-alerts")
      .then((r) => (r.ok ? r.json() : []))
      .then(setAlerts)
      .finally(() => setLoading(false));
  }, []);

  const severities = useMemo(() => [...new Set(alerts.map((a) => a.severity))].sort(), [alerts]);
  const statuses = useMemo(() => [...new Set(alerts.map((a) => a.status))].sort(), [alerts]);
  const apps = useMemo(
    () => [...new Set(alerts.map((a) => a.application.name))].sort(),
    [alerts]
  );

  const filtered = useMemo(
    () =>
      alerts.filter(
        (a) =>
          (!severityFilter || a.severity === severityFilter) &&
          (!statusFilter || a.status === statusFilter) &&
          (!appFilter || a.application.name === appFilter)
      ),
    [alerts, severityFilter, statusFilter, appFilter]
  );

  const hasActiveFilter = severityFilter || statusFilter || appFilter;

  return (
    <div>
      <TopBar
        title="Monitoring Alerts"
        subtitle={`${filtered.length} alert${filtered.length === 1 ? "" : "s"} across all applications`}
      />

      {!loading && alerts.length > 0 && (
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="flex items-center gap-2 text-gray-500 dark:text-white/65">
            <Filter className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Filter By</span>
          </div>
          <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)} className={selectClass}>
            <option value="">All severities</option>
            {severities.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={selectClass}>
            <option value="">All statuses</option>
            {statuses.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select value={appFilter} onChange={(e) => setAppFilter(e.target.value)} className={selectClass}>
            <option value="">All applications</option>
            {apps.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          {hasActiveFilter && (
            <button
              type="button"
              onClick={() => {
                setSeverityFilter("");
                setStatusFilter("");
                setAppFilter("");
              }}
              className="h-9 px-3 text-sm font-medium text-gray-500 dark:text-white/65 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      )}

      {loading ? (
        <p className="text-gray-500 p-6">Loading…</p>
      ) : alerts.length === 0 ? (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-12 text-center">
          <Bell className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No monitoring alerts recorded.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-12 text-center">
          <Bell className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No alerts match the selected filters.</p>
        </div>
      ) : (
        <DataTable title="All Monitoring Alerts" subtitle="Sorted by most recent" icon={Bell}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className={tableHeadRow}>
                <tr>
                  <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Alert</th>
                  <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Application</th>
                  <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Severity</th>
                  <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Metric</th>
                  <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Threshold vs Current</th>
                  <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Status</th>
                  <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Assigned To</th>
                  <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Env</th>
                  <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <tr key={a.id} className={tableRow}>
                    <td className={`${tableCell} whitespace-nowrap`}>
                      <span className="font-mono text-xs text-brand-600 dark:text-brand-400">{a.alertCode}</span>
                      <div className="text-xs text-gray-500 dark:text-white/50">{a.alertType}</div>
                    </td>
                    <td className={`${tableCell} whitespace-nowrap`}>{a.application.name}</td>
                    <td className={`${tableCell} whitespace-nowrap`}>
                      <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold", SEVERITY_CLASSES[a.severity] ?? SEVERITY_CLASSES.Info)}>
                        {a.severity}
                      </span>
                    </td>
                    <td className={`${tableCell} whitespace-nowrap`}>{a.metric}</td>
                    <td className={`${tableCell} whitespace-nowrap text-gray-500`}>
                      {a.threshold ?? "—"} → <span className="text-gray-900 dark:text-white font-medium">{a.currentValue ?? "—"}</span>
                    </td>
                    <td className={`${tableCell} whitespace-nowrap`}><StatusBadge status={a.status} /></td>
                    <td className={`${tableCell} whitespace-nowrap`}>{a.assignedTo ?? "—"}</td>
                    <td className={`${tableCell} whitespace-nowrap`}>{a.environmentName}</td>
                    <td className={`${tableCell} whitespace-nowrap text-gray-500`}>{formatDate(a.timestamp)}</td>
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
