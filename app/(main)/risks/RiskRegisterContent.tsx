"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ChevronRight,
  Flame,
  HelpCircle,
  Info,
  User,
} from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { TablePageToolbar } from "@/components/filters/TablePageToolbar";
import { RISK_SORT_PRESETS } from "@/lib/table-sort-presets";
import { DataTable, DataTableHeadRow, tableCell, tableRow } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/badges/StatusBadge";
import { ProgressLink } from "@/components/layout/NavigationProgress";
import { cn } from "@/lib/utils";
import { getRiskLevel, RISK_LEVEL_COLOR, type RiskLevel } from "@/lib/risk-level";
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

/** Ownership is "concentrated" when one person owns more than half of owned risks. */
const OWNERSHIP_CONCENTRATION_THRESHOLD = 0.5;

const BAND_SOLID: Record<RiskLevel, string> = {
  LOW: "#10b981",
  MEDIUM: "#f59e0b",
  HIGH: "#f97316",
  CRITICAL: "#ef4444",
};

const HEATMAP_CELL_COLOR: Record<RiskLevel, string> = {
  LOW: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/25 dark:text-emerald-300",
  MEDIUM: "bg-amber-100 text-amber-800 dark:bg-amber-500/25 dark:text-amber-300",
  HIGH: "bg-orange-100 text-orange-800 dark:bg-orange-500/25 dark:text-orange-300",
  CRITICAL: "bg-red-100 text-red-800 dark:bg-red-500/30 dark:text-red-300",
};

const PANEL_CLASS =
  "rounded-[22px] border border-gray-200 dark:border-[var(--border)] bg-white dark:bg-[var(--card)] p-5 shadow-[0_16px_36px_-24px_rgba(112,144,176,0.25)] dark:shadow-none";

function clampScore(n: number) {
  return Math.min(5, Math.max(1, n));
}

function buildGrid(risks: RiskRow[]): number[][] {
  // rows: likelihood 5→1, cols: impact 1→5
  const grid = Array.from({ length: 5 }, () => Array.from({ length: 5 }, (): number => 0));
  for (const r of risks) {
    const li = clampScore(r.likelihood);
    const im = clampScore(r.impact);
    grid[5 - li][im - 1]++;
  }
  return grid;
}

function bandCounts(risks: RiskRow[]): Record<RiskLevel, number> {
  const counts: Record<RiskLevel, number> = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
  for (const r of risks) {
    counts[getRiskLevel(r.riskScore)]++;
  }
  return counts;
}

/**
 * Biggest cluster: highest cell count. Ties broken by scan order —
 * likelihood 5→1 (top→bottom), then impact 1→5 (left→right); first max wins.
 */
function findBiggestCluster(grid: number[][]): {
  likelihood: number;
  impact: number;
  count: number;
  band: RiskLevel;
} | null {
  let best: { likelihood: number; impact: number; count: number; band: RiskLevel } | null = null;
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 5; col++) {
      const count = grid[row][col];
      if (count === 0) continue;
      if (!best || count > best.count) {
        const likelihood = 5 - row;
        const impact = col + 1;
        best = {
          likelihood,
          impact,
          count,
          band: getRiskLevel(likelihood * impact),
        };
      }
    }
  }
  return best;
}

type OwnershipInsight =
  | {
      kind: "concentrated";
      ownerId: string;
      ownerName: string;
      ownedCount: number;
      totalOwned: number;
      pct: number;
      distinctOwners: number;
    }
  | {
      kind: "even";
      distinctOwners: number;
      totalOwned: number;
    }
  | { kind: "none" };

function ownershipInsight(risks: RiskRow[]): OwnershipInsight {
  const byOwner = new Map<string, { id: string; name: string; count: number }>();
  for (const r of risks) {
    if (!r.riskOwner) continue;
    const key = r.riskOwner.id;
    const existing = byOwner.get(key);
    if (existing) {
      existing.count++;
    } else {
      byOwner.set(key, {
        id: r.riskOwner.id,
        name: r.riskOwner.name || r.riskOwner.userId || "Unknown",
        count: 1,
      });
    }
  }

  const owners = [...byOwner.values()].sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return a.name.localeCompare(b.name);
  });

  const totalOwned = owners.reduce((sum, o) => sum + o.count, 0);
  if (totalOwned === 0 || owners.length === 0) return { kind: "none" };

  const top = owners[0];
  const pct = top.count / totalOwned;
  if (pct > OWNERSHIP_CONCENTRATION_THRESHOLD) {
    return {
      kind: "concentrated",
      ownerId: top.id,
      ownerName: top.name,
      ownedCount: top.count,
      totalOwned,
      pct: Math.round(pct * 100),
      distinctOwners: owners.length,
    };
  }

  return {
    kind: "even",
    distinctOwners: owners.length,
    totalOwned,
  };
}

function HeatMapCell({
  likelihood,
  impact,
  count,
  active,
  onSelect,
}: {
  likelihood: number;
  impact: number;
  count: number;
  active: boolean;
  onSelect: (likelihood: number, impact: number) => void;
}) {
  const [hover, setHover] = useState(false);
  const score = likelihood * impact;
  const band = getRiskLevel(score);
  const empty = count === 0;

  return (
    <button
      type="button"
      onClick={() => !empty && onSelect(likelihood, impact)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      disabled={empty}
      aria-label={
        empty
          ? `Likelihood ${likelihood}, Impact ${impact}: no risks`
          : `Likelihood ${likelihood}, Impact ${impact}: ${count} risk${count === 1 ? "" : "s"}, ${band}`
      }
      className={cn(
        "group relative flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-xl text-[15px] font-bold transition-all duration-150",
        "hover:z-10 hover:scale-110 hover:shadow-lg disabled:cursor-default disabled:hover:scale-100 disabled:hover:shadow-none",
        empty
          ? "bg-slate-100 text-slate-300 dark:bg-gray-800 dark:text-gray-600"
          : HEATMAP_CELL_COLOR[band],
        active && !empty && "ring-2 ring-brand-500 dark:ring-brand-400 scale-105"
      )}
    >
      {count > 0 ? count : ""}
      {hover && !empty && (
        <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-44 -translate-x-1/2 rounded-xl bg-slate-900 p-2.5 text-left text-[11px] leading-snug text-white shadow-xl dark:bg-slate-950">
          <div className="font-bold">
            {count} risk{count !== 1 ? "s" : ""} · Score {score}
          </div>
          <div className="mt-0.5" style={{ color: BAND_SOLID[band] }}>
            {band}
          </div>
          <div className="mt-1 text-white/60">
            Likelihood {likelihood} × Impact {impact}
          </div>
        </div>
      )}
    </button>
  );
}

function LegendRow({ band, count, total }: { band: RiskLevel; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="h-3.5 w-3.5 shrink-0 rounded-md" style={{ background: BAND_SOLID[band] }} />
      <span className="w-20 text-[12.5px] font-semibold text-slate-700 dark:text-slate-300">{band}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-gray-700">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: BAND_SOLID[band] }} />
      </div>
      <span className="w-8 text-right text-[12.5px] font-bold text-slate-800 dark:text-slate-200">{count}</span>
    </div>
  );
}

function RiskHeatMapSection({
  risks,
  selectedLikelihood,
  selectedImpact,
  onCellSelect,
  onOwnerSelect,
}: {
  risks: RiskRow[];
  selectedLikelihood: string;
  selectedImpact: string;
  onCellSelect: (likelihood: number, impact: number) => void;
  onOwnerSelect: (ownerId: string) => void;
}) {
  const grid = useMemo(() => buildGrid(risks), [risks]);
  const counts = useMemo(() => bandCounts(risks), [risks]);
  const total = risks.length;
  const cluster = useMemo(() => findBiggestCluster(grid), [grid]);
  const ownership = useMemo(() => ownershipInsight(risks), [risks]);

  const selLi = selectedLikelihood ? parseInt(selectedLikelihood, 10) : NaN;
  const selIm = selectedImpact ? parseInt(selectedImpact, 10) : NaN;

  return (
    <div className="mb-6 grid grid-cols-1 gap-5 lg:grid-cols-[1fr_360px]">
      {/* Heat map */}
      <div className="rounded-[24px] border border-gray-200 dark:border-[var(--border)] bg-white dark:bg-[var(--card)] p-6 sm:p-7 shadow-[0_18px_40px_-24px_rgba(112,144,176,0.18)] dark:shadow-none">
        <div className="mb-1 flex items-center gap-2">
          <h2 className="text-[16px] font-bold text-slate-800 dark:text-white">Risk Heat Map</h2>
          <span className="group/tip relative">
            <Info
              size={13}
              className="cursor-help text-slate-300 hover:text-brand-500 dark:text-slate-500 dark:hover:text-brand-400"
              aria-label="About the risk heat map"
            />
            <span className="pointer-events-none absolute left-0 top-6 z-30 w-56 rounded-xl bg-slate-900 p-3 text-[11px] leading-relaxed text-white opacity-0 shadow-xl transition-opacity group-hover/tip:opacity-100 dark:bg-slate-950">
              Every risk is plotted by how likely it is and how bad it would be if it happened. Click a cell to see just those risks.
            </span>
          </span>
        </div>
        <p className="mb-6 text-[12.5px] text-slate-400 dark:text-slate-500">
          Click any cell to filter the risk list to that exact combination
        </p>

        <div className="flex gap-3">
          <div className="flex flex-col items-center justify-center pr-1">
            <span
              className="whitespace-nowrap text-[11px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500"
              style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
            >
              ↑ Likelihood
            </span>
          </div>

          <div>
            <div className="flex flex-col gap-2">
              {grid.map((row, rowIdx) => {
                const likelihood = 5 - rowIdx;
                return (
                  <div key={likelihood} className="flex items-center gap-2">
                    <span className="w-4 text-center text-[12px] font-bold text-slate-400 dark:text-slate-500">
                      {likelihood}
                    </span>
                    {row.map((count, colIdx) => {
                      const impact = colIdx + 1;
                      return (
                        <HeatMapCell
                          key={`${likelihood}-${impact}`}
                          likelihood={likelihood}
                          impact={impact}
                          count={count}
                          active={selLi === likelihood && selIm === impact}
                          onSelect={onCellSelect}
                        />
                      );
                    })}
                  </div>
                );
              })}
              <div className="mt-1 flex items-center gap-2 pl-6">
                {[1, 2, 3, 4, 5].map((n) => (
                  <span
                    key={n}
                    className="flex h-auto w-14 sm:w-16 justify-center text-[12px] font-bold text-slate-400 dark:text-slate-500"
                  >
                    {n}
                  </span>
                ))}
              </div>
            </div>
            <div className="mt-1 text-center text-[11px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">
              Impact →
            </div>
          </div>
        </div>
      </div>

      {/* Info panel */}
      <div className="flex flex-col gap-4">
        <div className={PANEL_CLASS}>
          <div className="mb-3 flex items-center gap-2">
            <HelpCircle size={16} className="text-brand-500" />
            <h3 className="text-[13.5px] font-bold text-slate-800 dark:text-white">Understanding This Matrix</h3>
          </div>
          <div className="space-y-3 text-[12.5px] leading-relaxed text-slate-600 dark:text-slate-300">
            <p>
              Each risk gets two scores from 1 (lowest) to 5 (highest):
              <br />
              <b className="text-slate-800 dark:text-slate-100">Likelihood</b> — how probable it is
              <br />
              <b className="text-slate-800 dark:text-slate-100">Impact</b> — how bad it would be
            </p>
            <div className="rounded-xl bg-brand-50 px-3 py-2.5 text-center text-[13px] font-bold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
              Risk Score = Likelihood × Impact
            </div>
            <p>
              A cell in the top-right (high likelihood, high impact) is the most dangerous combination — those risks need attention first.
            </p>
          </div>
        </div>

        <div className={PANEL_CLASS}>
          <h3 className="mb-3 text-[13.5px] font-bold text-slate-800 dark:text-white">Risk Level Breakdown</h3>
          <div className="space-y-2.5">
            <LegendRow band="LOW" count={counts.LOW} total={total} />
            <LegendRow band="MEDIUM" count={counts.MEDIUM} total={total} />
            <LegendRow band="HIGH" count={counts.HIGH} total={total} />
            <LegendRow band="CRITICAL" count={counts.CRITICAL} total={total} />
          </div>
          <div className="mt-3 border-t border-slate-100 pt-3 text-[11px] text-slate-400 dark:border-gray-700 dark:text-slate-500">
            Score 1-5 Low · 6-11 Medium · 12-19 High · 20-25 Critical
          </div>
        </div>

        {cluster && cluster.count >= 2 && (
          <div className="rounded-[22px] bg-gradient-to-br from-amber-50 to-orange-50 p-5 ring-1 ring-amber-100 dark:from-amber-500/10 dark:to-orange-500/10 dark:ring-amber-500/20">
            <div className="mb-2 flex items-center gap-2">
              <Flame size={15} className="text-amber-500" />
              <h3 className="text-[13px] font-bold text-amber-800 dark:text-amber-300">Biggest Cluster</h3>
            </div>
            <p className="text-[12.5px] leading-relaxed text-amber-900 dark:text-amber-100/90">
              <b>
                {cluster.count} risk{cluster.count !== 1 ? "s" : ""}
              </b>{" "}
              sit at Likelihood {cluster.likelihood} / Impact {cluster.impact} ({cluster.band}) — your largest
              concentration.
              {cluster.band === "MEDIUM" || cluster.band === "LOW"
                ? " Most of your real risk exposure in this view is moderate, not extreme."
                : " This cell is where attention should go first."}
            </p>
            <button
              type="button"
              onClick={() => onCellSelect(cluster.likelihood, cluster.impact)}
              className="mt-3 flex items-center gap-1 text-[12px] font-bold text-amber-700 hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-200"
            >
              View these risks <ChevronRight size={13} />
            </button>
          </div>
        )}

        {ownership.kind === "concentrated" && (
          <div className="rounded-[22px] bg-gradient-to-br from-rose-50 to-red-50 p-5 ring-1 ring-rose-100 dark:from-rose-500/10 dark:to-red-500/10 dark:ring-rose-500/20">
            <div className="mb-2 flex items-center gap-2">
              <User size={15} className="text-rose-500" />
              <h3 className="text-[13px] font-bold text-rose-800 dark:text-rose-300">Ownership Concentration</h3>
            </div>
            <p className="text-[12.5px] leading-relaxed text-rose-900 dark:text-rose-100/90">
              <b>
                {ownership.ownerName} owns {ownership.pct}%
              </b>{" "}
              of assigned risks ({ownership.ownedCount} of {ownership.totalOwned}). Only {ownership.distinctOwners}{" "}
              {ownership.distinctOwners === 1 ? "person holds" : "people hold"} any risk ownership in this view.
            </p>
            <button
              type="button"
              onClick={() => onOwnerSelect(ownership.ownerId)}
              className="mt-3 flex items-center gap-1 text-[12px] font-bold text-rose-700 hover:text-rose-900 dark:text-rose-400 dark:hover:text-rose-200"
            >
              View this owner&apos;s risks <ChevronRight size={13} />
            </button>
          </div>
        )}

        {ownership.kind === "even" && (
          <div className="rounded-[22px] bg-gradient-to-br from-slate-50 to-slate-100 p-5 ring-1 ring-slate-200 dark:from-slate-500/10 dark:to-slate-600/10 dark:ring-slate-500/20">
            <div className="mb-2 flex items-center gap-2">
              <User size={15} className="text-slate-500 dark:text-slate-400" />
              <h3 className="text-[13px] font-bold text-slate-700 dark:text-slate-200">Ownership Concentration</h3>
            </div>
            <p className="text-[12.5px] leading-relaxed text-slate-600 dark:text-slate-300">
              Risk ownership is evenly distributed across {ownership.distinctOwners}{" "}
              {ownership.distinctOwners === 1 ? "person" : "people"} — no single owner holds more than half of
              assigned risks in this view.
            </p>
          </div>
        )}
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
    setFilters,
    setSort,
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

  const onCellSelect = (likelihood: number, impact: number) => {
    setFilters({ likelihood: String(likelihood), impact: String(impact) });
  };

  const onOwnerSelect = (ownerId: string) => {
    setFilters({ riskOwnerId: ownerId, likelihood: "", impact: "" });
  };

  return (
    <div>
      <TopBar
        trailing={<PageDocumentation pageKey="risks" />}
        title="Risk Register"
        subtitle={`${risks.length} risk${risks.length === 1 ? "" : "s"} across all releases`}
      />
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
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </FilterSelect>
          )}
        </TableFilterBar>
      )}

      {!tablePending && (
        <RiskHeatMapSection
          risks={risks}
          selectedLikelihood={values.likelihood ?? ""}
          selectedImpact={values.impact ?? ""}
          onCellSelect={onCellSelect}
          onOwnerSelect={onOwnerSelect}
        />
      )}

      {tablePending ? (
        <TableSkeleton columns={RISK_COLUMNS.length} />
      ) : (
        <DataTable
          title="All Risks"
          icon={AlertTriangle}
          toolbar={
            <TablePageToolbar
              columnPicker={columnPicker}
              presets={RISK_SORT_PRESETS}
              sortKey={sortKey}
              sortDir={sortDir}
              onSelectSort={setSort}
            />
          }
        >
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
                          <ProgressLink
                            href={`/releases/${r.release.id}`}
                            className="text-brand-600 dark:text-brand-400 hover:underline text-xs"
                          >
                            {r.release.releaseCode}
                          </ProgressLink>
                        </td>
                      )}
                      {isColumnVisible("category") && (
                        <td className={`${tableCell} whitespace-nowrap`}>{r.category}</td>
                      )}
                      {isColumnVisible("description") && (
                        <td className={`${tableCell} max-w-[260px] truncate`} title={r.description}>
                          {r.description}
                        </td>
                      )}
                      {isColumnVisible("likelihood") && (
                        <td className={`${tableCell} text-center whitespace-nowrap`}>{r.likelihood}</td>
                      )}
                      {isColumnVisible("impact") && (
                        <td className={`${tableCell} text-center whitespace-nowrap`}>{r.impact}</td>
                      )}
                      {isColumnVisible("riskScore") && (
                        <td className={`${tableCell} whitespace-nowrap`}>
                          <span
                            className={cn(
                              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold",
                              RISK_LEVEL_COLOR[getRiskLevel(r.riskScore)]
                            )}
                          >
                            {r.riskScore} · {getRiskLevel(r.riskScore)}
                          </span>
                        </td>
                      )}
                      {isColumnVisible("affectedArea") && (
                        <td
                          className={`${tableCell} whitespace-nowrap text-gray-600 dark:text-gray-300 truncate max-w-[200px]`}
                          title={r.affectedArea ?? ""}
                        >
                          {r.affectedArea ?? "—"}
                        </td>
                      )}
                      {isColumnVisible("mitigationStrategy") && (
                        <td
                          className={`${tableCell} whitespace-nowrap text-gray-600 dark:text-gray-300 truncate max-w-[200px]`}
                          title={r.mitigationStrategy ?? ""}
                        >
                          {r.mitigationStrategy ?? "—"}
                        </td>
                      )}
                      {isColumnVisible("riskOwner") && (
                        <td className={`${tableCell} whitespace-nowrap text-gray-600 dark:text-gray-300`}>
                          {r.riskOwner?.name ?? r.riskOwner?.userId ?? "—"}
                        </td>
                      )}
                      {isColumnVisible("status") && (
                        <td className={`${tableCell} whitespace-nowrap`}>
                          <StatusBadge status={r.status} />
                        </td>
                      )}
                      {isColumnVisible("notes") && (
                        <td
                          className={`${tableCell} whitespace-nowrap text-gray-600 dark:text-gray-300 truncate max-w-[200px]`}
                          title={r.notes ?? ""}
                        >
                          {r.notes ?? "—"}
                        </td>
                      )}
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
