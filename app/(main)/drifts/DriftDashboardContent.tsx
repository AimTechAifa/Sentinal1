"use client";

import { useEffect, useMemo, useState } from "react";
import { Filter, GitCompareArrows } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { StatusBadge } from "@/components/badges/StatusBadge";
import { ProgressLink } from "@/components/layout/NavigationProgress";
import { cn, formatDate } from "@/lib/utils";

type ReferenceDataRow = { id: string; category: string; value: string; sortOrder: number; active: boolean };

type DriftRow = {
  id: string;
  driftCode: string;
  release: { id: string; releaseCode: string; name: string; status: string };
  application: { id: string; name: string };
  environmentName: string;
  driftType: string;
  driftCategory: string | null;
  detectedDate: string;
  severity: string;
  description: string;
  impactOnRelease: string | null;
  remediationAction: string | null;
  status: string;
  etaToFix: string | null;
};

const SEVERITY_CLASSES: Record<string, string> = {
  Critical: "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300",
  High: "bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-300",
  Medium: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300",
  Low: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300",
};

import { DataTable, tableCell, tableHeadRow, tableRow } from "@/components/ui/data-table";

export default function DriftDashboardContent() {
  const [drifts, setDrifts] = useState<DriftRow[]>([]);
  const [driftTypes, setDriftTypes] = useState<ReferenceDataRow[]>([]);
  const [driftTypeFilter, setDriftTypeFilter] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/drifts").then((r) => (r.ok ? r.json() : [])),
      fetch("/api/reference-data?category=drift_type").then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([d, t]) => {
        setDrifts(d);
        setDriftTypes(t);
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredDrifts = useMemo(
    () => (driftTypeFilter ? drifts.filter((d) => d.driftType === driftTypeFilter) : drifts),
    [drifts, driftTypeFilter]
  );

  const selectClass =
    "h-9 rounded-lg border border-gray-300 dark:border-[var(--border)] bg-white dark:bg-[var(--card)] px-3 py-1 text-sm text-gray-700 dark:text-white shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:opacity-50";

  return (
    <div>
      <TopBar
        title="Drift Dashboard"
        subtitle={`${filteredDrifts.length} drift${filteredDrifts.length === 1 ? "" : "s"} detected across environments`}
      />

      {!loading && drifts.length > 0 && (
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="flex items-center gap-2 text-gray-500 dark:text-white/65">
            <Filter className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Filter By</span>
          </div>
          <select
            value={driftTypeFilter}
            onChange={(e) => setDriftTypeFilter(e.target.value)}
            className={selectClass}
          >
            <option value="">All drift types</option>
            {driftTypes.map((t) => (
              <option key={t.id} value={t.value}>{t.value}</option>
            ))}
          </select>
          {driftTypeFilter && (
            <button
              type="button"
              onClick={() => setDriftTypeFilter("")}
              className="h-9 px-3 text-sm font-medium text-gray-500 dark:text-white/65 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      )}

      {loading ? (
        <p className="text-gray-500 p-6">Loading…</p>
      ) : drifts.length === 0 ? (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-12 text-center">
          <GitCompareArrows className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No drift detected. All environments are in sync.</p>
        </div>
      ) : filteredDrifts.length === 0 ? (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-12 text-center">
          <GitCompareArrows className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No drifts match the selected filter.</p>
        </div>
      ) : (
        <DataTable title="All Drifts" subtitle="Sorted by detected date" icon={GitCompareArrows}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className={tableHeadRow}>
                <tr>
                  <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Drift Code</th>
                  <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Release</th>
                  <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Application</th>
                  <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Environment</th>
                  <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Type</th>
                  <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Category</th>
                  <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Detected Date</th>
                  <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Severity</th>
                  <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Description</th>
                  <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Impact</th>
                  <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Remediation</th>
                  <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Status</th>
                  <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>ETA</th>
                </tr>
              </thead>
              <tbody>
                {filteredDrifts.map((d) => (
                  <tr key={d.id} className={tableRow}>
                    <td className={`${tableCell} whitespace-nowrap`}>
                      <span className="font-mono text-xs text-brand-600 dark:text-brand-400">{d.driftCode}</span>
                    </td>
                    <td className={`${tableCell} whitespace-nowrap`}>
                      <ProgressLink href={`/releases/${d.release.id}`} className="text-brand-600 dark:text-brand-400 hover:underline text-xs">
                        {d.release.releaseCode}
                      </ProgressLink>
                    </td>
                    <td className={`${tableCell} whitespace-nowrap`}>{d.application.name}</td>
                    <td className={`${tableCell} whitespace-nowrap`}>{d.environmentName}</td>
                    <td className={`${tableCell} whitespace-nowrap`}>{d.driftType}</td>
                    <td className={`${tableCell} whitespace-nowrap`}>{d.driftCategory ?? "—"}</td>
                    <td className={`${tableCell} whitespace-nowrap text-gray-500`}>{formatDate(d.detectedDate)}</td>
                    <td className={`${tableCell} whitespace-nowrap`}>
                      <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold", SEVERITY_CLASSES[d.severity] ?? SEVERITY_CLASSES.Medium)}>
                        {d.severity}
                      </span>
                    </td>
                    <td className={`${tableCell} truncate max-w-[200px]`} title={d.description}>{d.description}</td>
                    <td className={`${tableCell} truncate max-w-[200px] whitespace-nowrap`} title={d.impactOnRelease ?? ""}>{d.impactOnRelease ?? "—"}</td>
                    <td className={`${tableCell} truncate max-w-[200px] whitespace-nowrap`} title={d.remediationAction ?? ""}>{d.remediationAction ?? "—"}</td>
                    <td className={`${tableCell} whitespace-nowrap`}><StatusBadge status={d.status} /></td>
                    <td className={`${tableCell} whitespace-nowrap text-gray-500`}>{d.etaToFix ? formatDate(d.etaToFix) : "—"}</td>
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
