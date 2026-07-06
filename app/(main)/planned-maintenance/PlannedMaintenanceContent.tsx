"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Filter, CalendarClock } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { StatusBadge } from "@/components/badges/StatusBadge";
import { formatDate } from "@/lib/utils";
import { DataTable, tableCell, tableHeadRow, tableRow } from "@/components/ui/data-table";

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

const selectClass =
  "h-9 rounded-lg border border-gray-300 dark:border-[var(--border)] bg-white dark:bg-[var(--card)] px-3 py-1 text-sm text-gray-700 dark:text-white shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:opacity-50";

export default function PlannedMaintenanceContent() {
  const searchParams = useSearchParams();
  const [rows, setRows] = useState<MaintenanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvalFilter, setApprovalFilter] = useState(searchParams.get("approvalStatus") ?? "");
  const [typeFilter, setTypeFilter] = useState(searchParams.get("type") ?? "");

  useEffect(() => {
    fetch("/api/planned-maintenance")
      .then((r) => (r.ok ? r.json() : []))
      .then(setRows)
      .finally(() => setLoading(false));
  }, []);

  const approvals = useMemo(() => [...new Set(rows.map((r) => r.approvalStatus))].sort(), [rows]);
  const types = useMemo(() => [...new Set(rows.map((r) => r.type))].sort(), [rows]);

  const filtered = useMemo(
    () =>
      rows.filter(
        (r) => (!approvalFilter || r.approvalStatus === approvalFilter) && (!typeFilter || r.type === typeFilter)
      ),
    [rows, approvalFilter, typeFilter]
  );

  const hasActiveFilter = approvalFilter || typeFilter;

  return (
    <div>
      <TopBar
        title="Planned Maintenance"
        subtitle={`${filtered.length} maintenance window${filtered.length === 1 ? "" : "s"} scheduled`}
      />

      {!loading && rows.length > 0 && (
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="flex items-center gap-2 text-gray-500 dark:text-white/65">
            <Filter className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Filter By</span>
          </div>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className={selectClass}>
            <option value="">All types</option>
            {types.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <select value={approvalFilter} onChange={(e) => setApprovalFilter(e.target.value)} className={selectClass}>
            <option value="">All approval statuses</option>
            {approvals.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          {hasActiveFilter && (
            <button
              type="button"
              onClick={() => {
                setApprovalFilter("");
                setTypeFilter("");
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
          <CalendarClock className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No planned maintenance recorded.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-12 text-center">
          <CalendarClock className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No windows match the selected filters.</p>
        </div>
      ) : (
        <DataTable title="Maintenance Calendar" subtitle="Sorted by scheduled date" icon={CalendarClock}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className={tableHeadRow}>
                <tr>
                  <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Scheduled</th>
                  <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Type</th>
                  <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Application</th>
                  <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Env</th>
                  <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Impact</th>
                  <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Approval</th>
                  <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Requestor</th>
                  <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Notes</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className={tableRow}>
                    <td className={`${tableCell} whitespace-nowrap`}>
                      <span className="font-mono text-xs text-brand-600 dark:text-brand-400">{r.maintenanceCode}</span>
                      <div className="text-xs text-gray-500 dark:text-white/50">
                        {formatDate(r.scheduledDate)} · {r.startTime}–{r.endTime}
                      </div>
                    </td>
                    <td className={`${tableCell} whitespace-nowrap`}>{r.type}</td>
                    <td className={`${tableCell} whitespace-nowrap`}>{r.application?.name ?? "—"}</td>
                    <td className={`${tableCell} whitespace-nowrap`}>{r.environmentName}</td>
                    <td className={`${tableCell} whitespace-nowrap`}>{r.impact}</td>
                    <td className={`${tableCell} whitespace-nowrap`}><StatusBadge status={r.approvalStatus} /></td>
                    <td className={`${tableCell} whitespace-nowrap`}>{r.requestor ?? "—"}</td>
                    <td className={`${tableCell} truncate max-w-[240px]`} title={r.notes ?? ""}>{r.notes ?? "—"}</td>
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
