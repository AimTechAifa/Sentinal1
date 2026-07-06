"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Filter, HeartPulse } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { cn, formatDate } from "@/lib/utils";
import { DataTable, tableCell, tableHeadRow, tableRow } from "@/components/ui/data-table";

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

const selectClass =
  "h-9 rounded-lg border border-gray-300 dark:border-[var(--border)] bg-white dark:bg-[var(--card)] px-3 py-1 text-sm text-gray-700 dark:text-white shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:opacity-50";

export default function ApplicationStatusContent() {
  const searchParams = useSearchParams();
  const [rows, setRows] = useState<StatusRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") ?? "");
  const [envFilter, setEnvFilter] = useState(searchParams.get("env") ?? "");

  useEffect(() => {
    fetch("/api/application-status")
      .then((r) => (r.ok ? r.json() : []))
      .then(setRows)
      .finally(() => setLoading(false));
  }, []);

  const statuses = useMemo(() => [...new Set(rows.map((r) => r.status))].sort(), [rows]);
  const envs = useMemo(() => [...new Set(rows.map((r) => r.environmentName))].sort(), [rows]);

  const filtered = useMemo(
    () =>
      rows.filter(
        (r) => (!statusFilter || r.status === statusFilter) && (!envFilter || r.environmentName === envFilter)
      ),
    [rows, statusFilter, envFilter]
  );

  const hasActiveFilter = statusFilter || envFilter;

  return (
    <div>
      <TopBar
        title="Application Status"
        subtitle={`${filtered.length} application × environment record${filtered.length === 1 ? "" : "s"} — current state snapshot`}
      />

      {!loading && rows.length > 0 && (
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="flex items-center gap-2 text-gray-500 dark:text-white/65">
            <Filter className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Filter By</span>
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={selectClass}>
            <option value="">All statuses</option>
            {statuses.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select value={envFilter} onChange={(e) => setEnvFilter(e.target.value)} className={selectClass}>
            <option value="">All environments</option>
            {envs.map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
          {hasActiveFilter && (
            <button
              type="button"
              onClick={() => {
                setStatusFilter("");
                setEnvFilter("");
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
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-12 text-center">
          <HeartPulse className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No application status data recorded.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-12 text-center">
          <HeartPulse className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No records match the selected filters.</p>
        </div>
      ) : (
        <DataTable title="Application Health" subtitle="One row per application × environment" icon={HeartPulse}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className={tableHeadRow}>
                <tr>
                  <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Application</th>
                  <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Environment</th>
                  <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Status</th>
                  <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Uptime %</th>
                  <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Last Check</th>
                  <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Notes</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className={tableRow}>
                    <td className={`${tableCell} whitespace-nowrap`}>{r.application.name}</td>
                    <td className={`${tableCell} whitespace-nowrap`}>{r.environmentName}</td>
                    <td className={`${tableCell} whitespace-nowrap`}>
                      <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold", STATUS_CLASSES[r.status] ?? STATUS_CLASSES.Degraded)}>
                        {r.status}
                      </span>
                    </td>
                    <td className={`${tableCell} whitespace-nowrap`}>
                      {r.uptimePercent != null ? `${(r.uptimePercent * 100).toFixed(1)}%` : "—"}
                    </td>
                    <td className={`${tableCell} whitespace-nowrap text-gray-500`}>{formatDate(r.lastCheck)}</td>
                    <td className={`${tableCell} truncate max-w-[280px]`} title={r.notes ?? ""}>{r.notes ?? "—"}</td>
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
