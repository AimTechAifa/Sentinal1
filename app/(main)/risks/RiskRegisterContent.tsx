"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { DataTable, tableCell, tableHeadRow, tableRow } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/badges/StatusBadge";
import { ProgressLink } from "@/components/layout/NavigationProgress";
import { cn } from "@/lib/utils";
import { getRiskLevel, RISK_LEVEL_COLOR } from "@/lib/risk-level";

type RiskRow = {
  id: string;
  riskCode: string;
  releaseId: string;
  release: { id: string; releaseCode: string; name: string; status: string };
  category: string;
  description: string;
  likelihood: number;
  impact: number;
  riskScore: number;
  affectedArea: string | null;
  mitigationStrategy: string | null;
  riskOwner: { id: string; userId: string; name: string; email: string } | null;
  status: string;
  notes: string | null;
};

type StatusFilter = "all" | "Open" | "Monitoring" | "Mitigating" | "In Progress" | "Escalated" | "Accepted";

// 5×5 heat map
function RiskHeatMap({ risks }: { risks: RiskRow[] }) {
  const grid = Array.from({ length: 5 }, () => Array.from({ length: 5 }, (): number => 0));
  for (const r of risks) {
    const li = Math.min(5, Math.max(1, r.likelihood)) - 1;
    const im = Math.min(5, Math.max(1, r.impact)) - 1;
    grid[4 - li][im]++;
  }

  const HEATMAP_CELL_COLOR: Record<ReturnType<typeof getRiskLevel>, string> = {
    LOW: "bg-emerald-200 dark:bg-emerald-700/40",
    MEDIUM: "bg-amber-200 dark:bg-amber-700/40",
    HIGH: "bg-orange-300 dark:bg-orange-700/40",
    CRITICAL: "bg-red-400 dark:bg-red-700/50",
  };

  const cellColor = (li: number, im: number) => {
    const score = (5 - li) * (im + 1);
    return HEATMAP_CELL_COLOR[getRiskLevel(score)];
  };

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 mb-6">
      <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Risk Heat Map</h3>
      <div className="flex gap-4">
        <div className="flex flex-col items-center justify-center">
          <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 writing-mode-vertical rotate-180" style={{ writingMode: "vertical-rl" }}>
            ← Likelihood →
          </span>
        </div>
        <div>
          <div className="grid grid-cols-5 gap-1">
            {grid.map((row, li) =>
              row.map((count, im) => (
                <div
                  key={`${li}-${im}`}
                  className={cn(
                    "w-12 h-12 rounded-lg flex items-center justify-center text-xs font-bold transition-all",
                    cellColor(li, im),
                    count > 0 ? "ring-2 ring-gray-900/20 dark:ring-white/20 scale-105" : "opacity-60"
                  )}
                >
                  {count > 0 ? count : ""}
                </div>
              ))
            )}
          </div>
          <p className="text-center text-[10px] font-semibold text-gray-500 dark:text-gray-400 mt-2">← Impact →</p>
        </div>
      </div>
    </div>
  );
}

export default function RiskRegisterContent() {
  const [risks, setRisks] = useState<RiskRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  useEffect(() => {
    fetch("/api/risks")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setRisks(d))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (statusFilter === "all") return risks;
    return risks.filter((r) => r.status === statusFilter);
  }, [risks, statusFilter]);

  const statuses: StatusFilter[] = ["all", "Open", "Monitoring", "Mitigating", "In Progress", "Escalated", "Accepted"];

  return (
    <div>
      <TopBar
        title="Risk Register"
        subtitle={`${filtered.length} risk${filtered.length === 1 ? "" : "s"} across all releases`}
      />

      <div className="flex flex-wrap gap-2 mb-4">
        {statuses.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatusFilter(s)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-medium capitalize border transition-colors",
              statusFilter === s
                ? "bg-brand-500 text-white border-brand-500"
                : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-brand-300"
            )}
          >
            {s}
          </button>
        ))}
      </div>

      <RiskHeatMap risks={filtered} />

      {loading ? (
        <p className="text-gray-500 p-6">Loading…</p>
      ) : (
        <DataTable title="All Risks" subtitle="Sorted by risk score (highest first)" icon={AlertTriangle}>
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className={tableHeadRow}>
              <tr>
                <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Risk ID</th>
                <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Release</th>
                <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Category</th>
                <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Description</th>
                <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Likelihood</th>
                <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Impact</th>
                <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Risk Score</th>
                <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Affected Area</th>
                <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Mitigation Strategy</th>
                <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Risk Owner</th>
                <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Status</th>
                <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Notes</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={12} className={`${tableCell} text-center text-gray-400 py-8`}>
                    No risks found.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} className={tableRow}>
                    <td className={`${tableCell} whitespace-nowrap`}>
                      <span className="font-mono text-xs text-brand-600 dark:text-brand-400">{r.riskCode}</span>
                    </td>
                    <td className={`${tableCell} whitespace-nowrap`}>
                      <ProgressLink href={`/releases/${r.release.id}`} className="text-brand-600 dark:text-brand-400 hover:underline text-xs">
                        {r.release.releaseCode}
                      </ProgressLink>
                    </td>
                    <td className={`${tableCell} whitespace-nowrap`}>{r.category}</td>
                    <td className={`${tableCell} max-w-[260px] truncate`} title={r.description}>{r.description}</td>
                    <td className={`${tableCell} text-center whitespace-nowrap`}>{r.likelihood}</td>
                    <td className={`${tableCell} text-center whitespace-nowrap`}>{r.impact}</td>
                    <td className={`${tableCell} whitespace-nowrap`}>
                      <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold", RISK_LEVEL_COLOR[getRiskLevel(r.riskScore)])}>
                        {r.riskScore} · {getRiskLevel(r.riskScore)}
                      </span>
                    </td>
                    <td className={`${tableCell} whitespace-nowrap text-gray-600 dark:text-gray-300 truncate max-w-[200px]`} title={r.affectedArea ?? ""}>{r.affectedArea ?? "—"}</td>
                    <td className={`${tableCell} whitespace-nowrap text-gray-600 dark:text-gray-300 truncate max-w-[200px]`} title={r.mitigationStrategy ?? ""}>{r.mitigationStrategy ?? "—"}</td>
                    <td className={`${tableCell} whitespace-nowrap text-gray-600 dark:text-gray-300`}>{r.riskOwner?.name ?? r.riskOwner?.userId ?? "—"}</td>
                    <td className={`${tableCell} whitespace-nowrap`}><StatusBadge status={r.status} /></td>
                    <td className={`${tableCell} whitespace-nowrap text-gray-600 dark:text-gray-300 truncate max-w-[200px]`} title={r.notes ?? ""}>{r.notes ?? "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
        </DataTable>
      )}
    </div>
  );
}
