"use client";

import { useEffect, useState } from "react";
import { CalendarOff } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { DataTable, tableCell, tableHeadRow, tableRow } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/badges/StatusBadge";
import { ProgressLink } from "@/components/layout/NavigationProgress";
import { cn, formatDate } from "@/lib/utils";

type LeaveRow = {
  id: string;
  leaveCode: string;
  user: { id: string; userId: string; name: string; role: string; department: string };
  leaveStart: string;
  leaveEnd: string;
  leaveType: string;
  days: number;
  riskImpact: string | null;
  riskScore: number;
  affectedReleases: {
    release: { id: string; releaseCode: string; name: string; status: string; releaseDate: string };
  }[];
};

const RISK_COLOR: Record<string, string> = {
  low: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300",
  medium: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300",
  high: "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300",
};

function riskLevel(score: number): string {
  if (score <= 3) return "low";
  if (score <= 6) return "medium";
  return "high";
}

export default function LeaveCalendarContent() {
  const [leaves, setLeaves] = useState<LeaveRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/leaves")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setLeaves(d))
      .finally(() => setLoading(false));
  }, []);

  const highRiskCount = leaves.filter((l) => l.riskScore >= 7).length;

  return (
    <div>
      <TopBar
        title="Leave & Resource Availability"
        subtitle={`${leaves.length} leave record${leaves.length === 1 ? "" : "s"}${highRiskCount > 0 ? ` · ${highRiskCount} high-risk` : ""}`}
      />



      {loading ? (
        <p className="text-gray-500 p-6">Loading…</p>
      ) : (
        <DataTable title="Leave Records" subtitle="Cross-referenced with affected releases" icon={CalendarOff}>
          <table className="w-full min-w-[1400px] text-sm">
            <thead className={tableHeadRow}>
              <tr>
                <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Leave ID</th>
                <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>User ID</th>
                <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>User Name</th>
                <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Department</th>
                <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Role</th>
                <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Leave Start</th>
                <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Leave End</th>
                <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Leave Type</th>
                <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Days</th>
                <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Affected Release</th>
                <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Risk Impact</th>
                <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Risk Score</th>
              </tr>
            </thead>
            <tbody>
              {leaves.length === 0 ? (
                <tr>
                  <td colSpan={12} className={`${tableCell} text-center text-gray-400 py-8`}>
                    No leave records found.
                  </td>
                </tr>
              ) : (
                leaves.map((l) => (
                  <tr key={l.id} className={tableRow}>
                    <td className={`${tableCell} whitespace-nowrap`}>
                      <span className="font-mono text-xs text-brand-600 dark:text-brand-400">{l.leaveCode}</span>
                    </td>
                    <td className={`${tableCell} whitespace-nowrap text-gray-600 dark:text-gray-300 font-mono`}>{l.user.userId}</td>
                    <td className={`${tableCell} whitespace-nowrap font-medium text-gray-900 dark:text-white`}>{l.user.name}</td>
                    <td className={`${tableCell} whitespace-nowrap text-gray-600 dark:text-gray-300`}>{l.user.department}</td>
                    <td className={`${tableCell} whitespace-nowrap text-gray-600 dark:text-gray-300`}>{l.user.role}</td>
                    <td className={`${tableCell} whitespace-nowrap text-gray-500 dark:text-gray-400`}>{formatDate(l.leaveStart)}</td>
                    <td className={`${tableCell} whitespace-nowrap text-gray-500 dark:text-gray-400`}>{formatDate(l.leaveEnd)}</td>
                    <td className={`${tableCell} whitespace-nowrap`}><StatusBadge status={l.leaveType} /></td>
                    <td className={`${tableCell} whitespace-nowrap text-center`}>{l.days}</td>
                    <td className={`${tableCell} whitespace-nowrap text-xs`}>
                      <div className="flex flex-wrap gap-1">
                        {l.affectedReleases.map((ar) => (
                          <ProgressLink
                            key={ar.release.id}
                            href={`/releases/${ar.release.id}`}
                            className="text-brand-600 dark:text-brand-400 hover:underline font-mono"
                          >
                            {ar.release.releaseCode}
                          </ProgressLink>
                        ))}
                        {l.affectedReleases.length === 0 && <span className="text-gray-400">—</span>}
                      </div>
                    </td>
                    <td className={`${tableCell} whitespace-nowrap text-gray-600 dark:text-gray-300 truncate max-w-[200px]`} title={l.riskImpact ?? ""}>{l.riskImpact ?? "—"}</td>
                    <td className={`${tableCell} whitespace-nowrap`}>
                      <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold", RISK_COLOR[riskLevel(l.riskScore)])}>
                        {l.riskScore}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </DataTable>
      )}
    </div>
  );
}
