"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Filter, AlertOctagon } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { StatusBadge } from "@/components/badges/StatusBadge";
import { ProgressLink } from "@/components/layout/NavigationProgress";
import { cn, formatDate } from "@/lib/utils";
import { DataTable, tableCell, tableHeadRow, tableRow } from "@/components/ui/data-table";

type IncidentRow = {
  id: string;
  incidentCode: string;
  timestamp: string;
  application: { id: string; name: string };
  departmentName: string | null;
  severity: string;
  title: string;
  status: string;
  impact: string;
  assignedTo: string | null;
  relatedReleaseCode: string | null;
  relatedRelease: { id: string; releaseCode: string; name: string } | null;
  environmentName: string;
};

const SEVERITY_CLASSES: Record<string, string> = {
  P1: "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300",
  P2: "bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-300",
  P3: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300",
};

const selectClass =
  "h-9 rounded-lg border border-gray-300 dark:border-[var(--border)] bg-white dark:bg-[var(--card)] px-3 py-1 text-sm text-gray-700 dark:text-white shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:opacity-50";

export default function IncidentsContent() {
  const searchParams = useSearchParams();
  const [incidents, setIncidents] = useState<IncidentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState(searchParams.get("severity") ?? "");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") ?? "");

  useEffect(() => {
    fetch("/api/incidents")
      .then((r) => (r.ok ? r.json() : []))
      .then(setIncidents)
      .finally(() => setLoading(false));
  }, []);

  const severities = useMemo(() => [...new Set(incidents.map((i) => i.severity))].sort(), [incidents]);
  const statuses = useMemo(() => [...new Set(incidents.map((i) => i.status))].sort(), [incidents]);

  const filtered = useMemo(
    () =>
      incidents.filter(
        (i) => (!severityFilter || i.severity === severityFilter) && (!statusFilter || i.status === statusFilter)
      ),
    [incidents, severityFilter, statusFilter]
  );

  const hasActiveFilter = severityFilter || statusFilter;

  return (
    <div>
      <TopBar
        title="Incidents"
        subtitle={`${filtered.length} incident${filtered.length === 1 ? "" : "s"} across all applications`}
      />

      {!loading && incidents.length > 0 && (
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
          {hasActiveFilter && (
            <button
              type="button"
              onClick={() => {
                setSeverityFilter("");
                setStatusFilter("");
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
      ) : incidents.length === 0 ? (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-12 text-center">
          <AlertOctagon className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No incidents recorded.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-12 text-center">
          <AlertOctagon className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No incidents match the selected filters.</p>
        </div>
      ) : (
        <DataTable title="All Incidents" subtitle="Sorted by most recent" icon={AlertOctagon}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className={tableHeadRow}>
                <tr>
                  <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Incident</th>
                  <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Application</th>
                  <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Severity</th>
                  <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Title</th>
                  <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Status</th>
                  <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Impact</th>
                  <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Related Release</th>
                  <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Assigned To</th>
                  <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Env</th>
                  <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((i) => (
                  <tr key={i.id} className={tableRow}>
                    <td className={`${tableCell} whitespace-nowrap`}>
                      <span className="font-mono text-xs text-brand-600 dark:text-brand-400">{i.incidentCode}</span>
                    </td>
                    <td className={`${tableCell} whitespace-nowrap`}>{i.application.name}</td>
                    <td className={`${tableCell} whitespace-nowrap`}>
                      <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold", SEVERITY_CLASSES[i.severity] ?? SEVERITY_CLASSES.P3)}>
                        {i.severity}
                      </span>
                    </td>
                    <td className={`${tableCell} truncate max-w-[280px]`} title={i.title}>{i.title}</td>
                    <td className={`${tableCell} whitespace-nowrap`}><StatusBadge status={i.status} /></td>
                    <td className={`${tableCell} whitespace-nowrap`}>{i.impact}</td>
                    <td className={`${tableCell} whitespace-nowrap`}>
                      {i.relatedRelease ? (
                        <ProgressLink href={`/releases/${i.relatedRelease.id}`} className="text-brand-600 dark:text-brand-400 hover:underline text-xs">
                          {i.relatedRelease.releaseCode}
                        </ProgressLink>
                      ) : i.relatedReleaseCode ? (
                        <span className="text-xs text-gray-500">{i.relatedReleaseCode}</span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className={`${tableCell} whitespace-nowrap`}>{i.assignedTo ?? "—"}</td>
                    <td className={`${tableCell} whitespace-nowrap`}>{i.environmentName}</td>
                    <td className={`${tableCell} whitespace-nowrap text-gray-500`}>{formatDate(i.timestamp)}</td>
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
