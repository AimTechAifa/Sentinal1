"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { DataTable, DataTableHeadRow, TableToolbar, tableCell, tableRow } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/badges/StatusBadge";
import { ProgressLink } from "@/components/layout/NavigationProgress";
import { cn } from "@/lib/utils";
import { getRiskLevel, RISK_LEVEL_COLOR } from "@/lib/risk-level";
import { FilterPills, FilterSelect, TableFilterBar } from "@/components/filters/TableFilterBar";
import { RISK_COLUMNS, RISK_FILTER_FIELDS } from "@/lib/table-page-columns";
import { useFilteredFetch } from "@/hooks/useTableFilters";
import { useTablePageLoading } from "@/hooks/useTablePageLoading";
import { useTablePagePreferences } from "@/hooks/useTablePagePreferences";
import { TableSkeleton } from "@/components/ui/TableSkeleton";
import { PageDocumentation } from "@/components/help/PageDocumentation";
import { RISKS_FILTER_SCHEMA } from "@/lib/table-filters";

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

type StatusFilter = "Open" | "Monitoring" | "Mitigating" | "In Progress" | "Escalated" | "Accepted";

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
  const {
    rows: risks,
    loading,
    values,
    setFilter,
    clearAll,
    hasActive,
    sortKey,
    sortDir,
    toggleSort,
  } = useFilteredFetch<RiskRow>("/api/risks", RISKS_FILTER_SCHEMA, {
    defaultSortKey: "riskScore",
    defaultSortDir: "desc",
    sortAccessors: {
      riskCode: (r) => r.riskCode,
      release: (r) => r.release.releaseCode,
      category: (r) => r.category,
      description: (r) => r.description,
      likelihood: (r) => r.likelihood,
      impact: (r) => r.impact,
      riskScore: (r) => r.riskScore,
      affectedArea: (r) => r.affectedArea ?? "",
      mitigationStrategy: (r) => r.mitigationStrategy ?? "",
      riskOwner: (r) => r.riskOwner?.name ?? r.riskOwner?.userId ?? "",
      status: (r) => r.status,
      notes: (r) => r.notes ?? "",
    },
  });
  const [allRisks, setAllRisks] = useState<RiskRow[]>([]);

  useEffect(() => {
    fetch("/api/risks").then((r) => (r.ok ? r.json() : [])).then(setAllRisks);
  }, []);

  const categories = useMemo(() => [...new Set(allRisks.map((r) => r.category))].sort(), [allRisks]);
  const statuses: StatusFilter[] = ["Open", "Monitoring", "Mitigating", "In Progress", "Escalated", "Accepted"];

  const { isColumnVisible, columnPicker, filterPicker, isFilterVisible, prefsLoaded } = useTablePagePreferences(
    "risks",
    RISK_COLUMNS,
    RISK_FILTER_FIELDS,
    { lockedKeys: ["riskCode"] }
  );

  const tablePending = useTablePageLoading(loading, prefsLoaded);

  const visibleColCount = RISK_COLUMNS.filter((c) => isColumnVisible(c.key)).length;

  return (
    <div>
      <TopBar
        trailing={<PageDocumentation pageKey="risks" />}
        title="Risk Register" subtitle={`${risks.length} risk${risks.length === 1 ? "" : "s"} across all releases`} />
      {!tablePending && (
        <TableFilterBar hasActive={hasActive} onClear={clearAll} manageFilters={filterPicker}>
          {isFilterVisible("status") && (
            <FilterPills
              options={statuses.map((s) => ({ value: s, label: s }))}
              value={(values.status as StatusFilter) || ""}
              onChange={(v) => setFilter("status", v)}
            />
          )}
          {isFilterVisible("category") && (
            <FilterSelect value={values.category} onChange={(v) => setFilter("category", v)}>
              <option value="">All categories</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </FilterSelect>
          )}
        </TableFilterBar>
      )}

      <RiskHeatMap risks={risks} />

      {tablePending ? (
        <TableSkeleton columns={RISK_COLUMNS.length} />
      ) : (
        <DataTable title="All Risks" subtitle="Click column headers to sort" icon={AlertTriangle} toolbar={<TableToolbar>{columnPicker}</TableToolbar>}>
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <DataTableHeadRow
                columns={RISK_COLUMNS}
                isColumnVisible={isColumnVisible}
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={toggleSort}
              />
            </thead>
            <tbody>
              {risks.length === 0 ? (
                <tr>
                  <td colSpan={visibleColCount} className={`${tableCell} text-center text-gray-400 py-8`}>
                    No risks found.
                  </td>
                </tr>
              ) : (
                risks.map((r) => (
                  <tr key={r.id} className={tableRow}>
                    {isColumnVisible("riskCode") && (
                    <td className={`${tableCell} whitespace-nowrap`}>
                      <span className="font-mono text-xs text-brand-600 dark:text-brand-400">{r.riskCode}</span>
                    </td>
                    )}
                    {isColumnVisible("release") && (
                    <td className={`${tableCell} whitespace-nowrap`}>
                      <ProgressLink href={`/releases/${r.release.id}`} className="text-brand-600 dark:text-brand-400 hover:underline text-xs">
                        {r.release.releaseCode}
                      </ProgressLink>
                    </td>
                    )}
                    {isColumnVisible("category") && <td className={`${tableCell} whitespace-nowrap`}>{r.category}</td>}
                    {isColumnVisible("description") && <td className={`${tableCell} max-w-[260px] truncate`} title={r.description}>{r.description}</td>}
                    {isColumnVisible("likelihood") && <td className={`${tableCell} text-center whitespace-nowrap`}>{r.likelihood}</td>}
                    {isColumnVisible("impact") && <td className={`${tableCell} text-center whitespace-nowrap`}>{r.impact}</td>}
                    {isColumnVisible("riskScore") && (
                    <td className={`${tableCell} whitespace-nowrap`}>
                      <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold", RISK_LEVEL_COLOR[getRiskLevel(r.riskScore)])}>
                        {r.riskScore} · {getRiskLevel(r.riskScore)}
                      </span>
                    </td>
                    )}
                    {isColumnVisible("affectedArea") && <td className={`${tableCell} whitespace-nowrap text-gray-600 dark:text-gray-300 truncate max-w-[200px]`} title={r.affectedArea ?? ""}>{r.affectedArea ?? "—"}</td>}
                    {isColumnVisible("mitigationStrategy") && <td className={`${tableCell} whitespace-nowrap text-gray-600 dark:text-gray-300 truncate max-w-[200px]`} title={r.mitigationStrategy ?? ""}>{r.mitigationStrategy ?? "—"}</td>}
                    {isColumnVisible("riskOwner") && <td className={`${tableCell} whitespace-nowrap text-gray-600 dark:text-gray-300`}>{r.riskOwner?.name ?? r.riskOwner?.userId ?? "—"}</td>}
                    {isColumnVisible("status") && <td className={`${tableCell} whitespace-nowrap`}><StatusBadge status={r.status} /></td>}
                    {isColumnVisible("notes") && <td className={`${tableCell} whitespace-nowrap text-gray-600 dark:text-gray-300 truncate max-w-[200px]`} title={r.notes ?? ""}>{r.notes ?? "—"}</td>}
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
