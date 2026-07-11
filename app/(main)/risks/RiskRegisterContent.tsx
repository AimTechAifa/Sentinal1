"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ChevronRight,
  Circle,
  Flame,
  Grid3x3,
  HelpCircle,
  User,
} from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { TablePageToolbar } from "@/components/filters/TablePageToolbar";
import { RISK_SORT_PRESETS } from "@/lib/table-sort-presets";
import { DataTable, DataTableHeadRow, tableCell, tableRow } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/badges/StatusBadge";
import { ProgressLink } from "@/components/layout/NavigationProgress";
import { cn, formatDate } from "@/lib/utils";
import { getRiskLevel, RISK_LEVEL_COLOR, type RiskLevel } from "@/lib/risk-level";
import { FilterPills, FilterRangeInputs, FilterSelect, FilterTextInput, TableFilterBar } from "@/components/filters/TableFilterBar";
import {
  RISK_COLUMNS,
  RISK_DEFAULT_HIDDEN_FILTER_KEYS,
  RISK_FILTER_FIELDS,
} from "@/lib/table-page-columns";
import { useFilteredFetch } from "@/hooks/useTableFilters";
import { useTablePageLoading } from "@/hooks/useTablePageLoading";
import { loadJsonEffect } from "@/lib/safe-fetch";
import { useTablePagePreferences } from "@/hooks/useTablePagePreferences";
import { TableSkeleton } from "@/components/ui/TableSkeleton";
import { PageDocumentation } from "@/components/help/PageDocumentation";
import { RISKS_FILTER_SCHEMA } from "@/lib/table-filters";

/** Calendar days from today to prod/start date (can be negative if past). */
function daysOutFrom(iso: string | null | undefined): number {
  if (!iso) return 0;
  const target = new Date(iso);
  if (Number.isNaN(target.getTime())) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

type RiskRow = {
  id: string;
  riskCode: string;
  releaseId: string;
  release: {
    id: string;
    releaseCode: string;
    name: string;
    status: string;
    startDate: string | null;
    releaseDate: string;
  };
  applicationName: string | null;
  departmentName: string | null;
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
type HeatMapView = "matrix" | "bubble" | "density";

/** Ownership is "concentrated" when one person owns more than half of owned risks. */
const OWNERSHIP_CONCENTRATION_THRESHOLD = 0.5;

/** Heat-map band palette (v3) — MEDIUM gold vs HIGH tangerine kept clearly distinct. */
const BAND_COLOR: Record<
  RiskLevel,
  { bg: string; text: string; solid: string; darkBg: string; darkText: string }
> = {
  LOW: { bg: "#d1fae5", text: "#065f46", solid: "#059669", darkBg: "rgba(5,150,105,0.28)", darkText: "#6ee7b7" },
  MEDIUM: { bg: "#fef9c3", text: "#854d0e", solid: "#eab308", darkBg: "rgba(234,179,8,0.28)", darkText: "#fde047" },
  HIGH: { bg: "#fed7aa", text: "#9a3412", solid: "#ea580c", darkBg: "rgba(234,88,12,0.32)", darkText: "#fdba74" },
  CRITICAL: { bg: "#fecaca", text: "#7f1d1d", solid: "#dc2626", darkBg: "rgba(220,38,38,0.32)", darkText: "#fca5a5" },
};

const BAND_ORDER: RiskLevel[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

function useIsDarkMode() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const root = document.documentElement;
    const sync = () => setDark(root.classList.contains("dark") || root.classList.contains("theme-dark"));
    sync();
    const mo = new MutationObserver(sync);
    mo.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => mo.disconnect();
  }, []);
  return dark;
}

function clampScore(n: number) {
  return Math.min(5, Math.max(1, n));
}

/** rows: likelihood 5→1, cols: impact 1→5 */
function buildGrid(risks: RiskRow[]): number[][] {
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

function maxCellCount(grid: number[][]): number {
  let max = 0;
  for (const row of grid) for (const c of row) if (c > max) max = c;
  return max;
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
  dark,
}: {
  likelihood: number;
  impact: number;
  count: number;
  active: boolean;
  onSelect: (likelihood: number, impact: number) => void;
  dark: boolean;
}) {
  const [hover, setHover] = useState(false);
  const score = likelihood * impact;
  const band = getRiskLevel(score);
  const empty = count === 0;
  const c = BAND_COLOR[band];

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
        active && !empty && "ring-2 ring-brand-500 dark:ring-brand-400 scale-105"
      )}
      style={
        empty
          ? { background: dark ? "#1f2937" : "#eef2f7", color: dark ? "#4b5563" : "#c3cad6" }
          : { background: dark ? c.darkBg : c.bg, color: dark ? c.darkText : c.text }
      }
    >
      {count > 0 ? count : ""}
      {hover && !empty && (
        <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-44 -translate-x-1/2 rounded-xl bg-slate-900 p-2.5 text-left text-[11px] leading-snug text-white shadow-xl dark:bg-slate-950">
          <div className="font-bold">
            {count} risk{count !== 1 ? "s" : ""} · Score {score}
          </div>
          <div className="mt-0.5" style={{ color: c.solid }}>
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

function MatrixView({
  grid,
  selLi,
  selIm,
  onSelect,
  dark,
}: {
  grid: number[][];
  selLi: number;
  selIm: number;
  onSelect: (likelihood: number, impact: number) => void;
  dark: boolean;
}) {
  return (
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
                      onSelect={onSelect}
                      dark={dark}
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
  );
}

function BubbleView({
  grid,
  maxCount,
  onSelect,
}: {
  grid: number[][];
  maxCount: number;
  onSelect: (likelihood: number, impact: number) => void;
}) {
  const size = 420;
  const pad = 48;
  const step = (size - pad * 1.5) / 5;
  const pos = (likelihood: number, impact: number) => ({
    x: pad + (impact - 0.5) * step,
    y: size - pad - (likelihood - 0.5) * step,
  });
  const scale = maxCount > 0 ? maxCount : 1;
  const [tip, setTip] = useState<{
    x: number;
    y: number;
    count: number;
    score: number;
    band: RiskLevel;
    likelihood: number;
    impact: number;
  } | null>(null);

  return (
    <div className="relative mx-auto w-full max-w-[480px]">
      <svg viewBox={`0 0 ${size + 16} ${size}`} width="100%" className="overflow-visible">
        {[1, 2, 3, 4, 5].map((n) => (
          <g key={n}>
            <line
              x1={pad}
              y1={size - pad - (n - 0.5) * step}
              x2={size}
              y2={size - pad - (n - 0.5) * step}
              className="stroke-slate-100 dark:stroke-slate-700"
            />
            <line
              x1={pad + (n - 0.5) * step}
              y1={0}
              x2={pad + (n - 0.5) * step}
              y2={size - pad}
              className="stroke-slate-100 dark:stroke-slate-700"
            />
          </g>
        ))}
        <line x1={pad} y1={0} x2={pad} y2={size - pad} className="stroke-slate-300 dark:stroke-slate-500" strokeWidth={1.5} />
        <line x1={pad} y1={size - pad} x2={size} y2={size - pad} className="stroke-slate-300 dark:stroke-slate-500" strokeWidth={1.5} />
        {[1, 2, 3, 4, 5].map((n) => (
          <text
            key={`xl${n}`}
            x={pad + (n - 0.5) * step}
            y={size - pad + 20}
            textAnchor="middle"
            fontSize="11"
            fontWeight="700"
            className="fill-slate-400 dark:fill-slate-500"
          >
            {n}
          </text>
        ))}
        {[1, 2, 3, 4, 5].map((n) => (
          <text
            key={`yl${n}`}
            x={pad - 14}
            y={size - pad - (n - 0.5) * step + 4}
            textAnchor="middle"
            fontSize="11"
            fontWeight="700"
            className="fill-slate-400 dark:fill-slate-500"
          >
            {n}
          </text>
        ))}

        {grid.flatMap((row, rowIdx) =>
          row.map((count, colIdx) => {
            if (count === 0) return null;
            const likelihood = 5 - rowIdx;
            const impact = colIdx + 1;
            const p = pos(likelihood, impact);
            const score = likelihood * impact;
            const band = getRiskLevel(score);
            const solid = BAND_COLOR[band].solid;
            const r = 9 + (count / scale) * 26;
            return (
              <g
                key={`${likelihood}-${impact}`}
                className="cursor-pointer"
                onClick={() => onSelect(likelihood, impact)}
                onMouseEnter={() =>
                  setTip({ x: p.x, y: p.y - r, count, score, band, likelihood, impact })
                }
                onMouseLeave={() => setTip(null)}
              >
                <circle cx={p.x} cy={p.y} r={r} fill={solid} fillOpacity={0.82} stroke={solid} strokeWidth={2} />
                <text x={p.x} y={p.y + 4} textAnchor="middle" fontSize="12" fontWeight="800" fill="#fff">
                  {count}
                </text>
              </g>
            );
          })
        )}
      </svg>
      {tip && (
        <div
          className="pointer-events-none absolute z-20 w-44 -translate-x-1/2 -translate-y-full rounded-xl bg-slate-900 p-2.5 text-left text-[11px] leading-snug text-white shadow-xl dark:bg-slate-950"
          style={{
            left: `${(tip.x / (size + 16)) * 100}%`,
            top: `${(tip.y / size) * 100}%`,
          }}
        >
          <div className="font-bold">
            {tip.count} risk{tip.count !== 1 ? "s" : ""} · Score {tip.score}
          </div>
          <div className="mt-0.5" style={{ color: BAND_COLOR[tip.band].solid }}>
            {tip.band}
          </div>
          <div className="mt-1 text-white/60">
            Likelihood {tip.likelihood} × Impact {tip.impact}
          </div>
        </div>
      )}
    </div>
  );
}

function DensityView({
  grid,
  maxCount,
  onSelect,
  dark,
}: {
  grid: number[][];
  maxCount: number;
  onSelect: (likelihood: number, impact: number) => void;
  dark: boolean;
}) {
  const size = 420;
  const pad = 48;
  const step = (size - pad * 1.5) / 5;
  const pos = (likelihood: number, impact: number) => ({
    x: pad + (impact - 0.5) * step,
    y: size - pad - (likelihood - 0.5) * step,
  });
  const scale = maxCount > 0 ? maxCount : 1;

  const cells = (() => {
    const out: {
      likelihood: number;
      impact: number;
      count: number;
      band: RiskLevel;
      p: { x: number; y: number };
      r: number;
    }[] = [];
    grid.forEach((row, rowIdx) => {
      row.forEach((count, colIdx) => {
        if (count === 0) return;
        const likelihood = 5 - rowIdx;
        const impact = colIdx + 1;
        out.push({
          likelihood,
          impact,
          count,
          band: getRiskLevel(likelihood * impact),
          p: pos(likelihood, impact),
          r: 26 + (count / scale) * 50,
        });
      });
    });
    return out;
  })();

  return (
    <div className="flex justify-center">
      <svg viewBox={`0 0 ${size + 16} ${size}`} width="100%" style={{ maxWidth: 480 }}>
        <defs>
          {cells.map((c) => (
            <radialGradient key={`g-${c.likelihood}-${c.impact}`} id={`risk-density-${c.likelihood}-${c.impact}`}>
              <stop offset="0%" stopColor={BAND_COLOR[c.band].solid} stopOpacity={0.85} />
              <stop offset="100%" stopColor={BAND_COLOR[c.band].solid} stopOpacity={0} />
            </radialGradient>
          ))}
        </defs>
        <rect
          x={pad}
          y={0}
          width={size - pad}
          height={size - pad}
          fill={dark ? "rgba(15,23,42,0.45)" : "#fafbfd"}
        />
        <g style={{ mixBlendMode: dark ? "screen" : "multiply" }}>
          {cells.map((c) => (
            <circle
              key={`glow-${c.likelihood}-${c.impact}`}
              cx={c.p.x}
              cy={c.p.y}
              r={c.r}
              fill={`url(#risk-density-${c.likelihood}-${c.impact})`}
            />
          ))}
        </g>
        {/* 5×5 cell separators — after glow, before count labels */}
        <g stroke={dark ? "rgba(255,255,255,0.35)" : "#ffffff"} strokeWidth={2} opacity={0.9}>
          {[0, 1, 2, 3, 4, 5].map((n) => (
            <line key={`gx${n}`} x1={pad + n * step} y1={0} x2={pad + n * step} y2={size - pad} />
          ))}
          {[0, 1, 2, 3, 4, 5].map((n) => (
            <line key={`gy${n}`} x1={pad} y1={n * step} x2={size} y2={n * step} />
          ))}
        </g>
        {cells.map((c) => (
          <g
            key={`pt-${c.likelihood}-${c.impact}`}
            className="cursor-pointer"
            onClick={() => onSelect(c.likelihood, c.impact)}
          >
            <circle cx={c.p.x} cy={c.p.y} r={3} fill={dark ? "#e2e8f0" : "#1e293b"} />
            <text
              x={c.p.x}
              y={c.p.y - 10}
              textAnchor="middle"
              fontSize="12"
              fontWeight="800"
              fill={dark ? "#f1f5f9" : "#1e293b"}
            >
              {c.count}
            </text>
          </g>
        ))}
        <line x1={pad} y1={0} x2={pad} y2={size - pad} className="stroke-slate-300 dark:stroke-slate-500" strokeWidth={1.5} />
        <line x1={pad} y1={size - pad} x2={size} y2={size - pad} className="stroke-slate-300 dark:stroke-slate-500" strokeWidth={1.5} />
        {[1, 2, 3, 4, 5].map((n) => (
          <text
            key={`xl${n}`}
            x={pad + (n - 0.5) * step}
            y={size - pad + 20}
            textAnchor="middle"
            fontSize="11"
            fontWeight="700"
            className="fill-slate-400 dark:fill-slate-500"
          >
            {n}
          </text>
        ))}
        {[1, 2, 3, 4, 5].map((n) => (
          <text
            key={`yl${n}`}
            x={pad - 14}
            y={size - pad - (n - 0.5) * step + 4}
            textAnchor="middle"
            fontSize="11"
            fontWeight="700"
            className="fill-slate-400 dark:fill-slate-500"
          >
            {n}
          </text>
        ))}
      </svg>
    </div>
  );
}

function LegendRow({
  band,
  count,
  total,
}: {
  band: RiskLevel;
  count: number;
  total: number;
}) {
  const c = BAND_COLOR[band];
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="h-3.5 w-3.5 shrink-0 rounded-md" style={{ background: c.solid }} />
      <span className="w-20 text-[12.5px] font-semibold text-slate-700 dark:text-slate-200">{band}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: c.solid }} />
      </div>
      <span className="w-8 text-right text-[12.5px] font-bold text-slate-800 dark:text-slate-100">{count}</span>
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
  const [view, setView] = useState<HeatMapView>("matrix");
  const dark = useIsDarkMode();
  const grid = useMemo(() => buildGrid(risks), [risks]);
  const counts = useMemo(() => bandCounts(risks), [risks]);
  const total = useMemo(() => BAND_ORDER.reduce((sum, b) => sum + counts[b], 0), [counts]);
  const maxCount = useMemo(() => maxCellCount(grid), [grid]);
  const cluster = useMemo(() => findBiggestCluster(grid), [grid]);
  const ownership = useMemo(() => ownershipInsight(risks), [risks]);

  const selLi = selectedLikelihood ? parseInt(selectedLikelihood, 10) : NaN;
  const selIm = selectedImpact ? parseInt(selectedImpact, 10) : NaN;

  const VIEWS: { key: HeatMapView; label: string; icon: typeof Grid3x3 }[] = [
    { key: "matrix", label: "Matrix", icon: Grid3x3 },
    { key: "bubble", label: "Bubble", icon: Circle },
    { key: "density", label: "Density", icon: Flame },
  ];

  return (
    <div className="mb-6 grid grid-cols-1 gap-5 lg:grid-cols-[340px_1fr]">
      {/* LEFT — explanatory info panel */}
      <div className="flex flex-col gap-4">
        <div className="rounded-[22px] border border-gray-200 bg-white p-5 shadow-[0_16px_36px_-24px_rgba(112,144,176,0.25)] dark:border-[var(--border)] dark:bg-[var(--card)] dark:shadow-none">
          <div className="mb-3 flex items-center gap-2">
            <HelpCircle size={16} className="text-brand-500 dark:text-brand-400" />
            <h3 className="text-[13.5px] font-bold text-slate-800 dark:text-white">Understanding This Matrix</h3>
          </div>
          <div className="space-y-3 text-[12.5px] leading-relaxed text-slate-600 dark:text-slate-300">
            <p>
              Each risk gets two scores from 1 (lowest) to 5 (highest):
              <br />
              <b className="text-slate-800 dark:text-white">Likelihood</b> — how probable it is
              <br />
              <b className="text-slate-800 dark:text-white">Impact</b> — how bad it would be
            </p>
            <div className="rounded-xl bg-brand-50 px-3 py-2.5 text-center text-[13px] font-bold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
              Risk Score = Likelihood × Impact
            </div>
            <p>
              A cell in the top-right (high likelihood, high impact) is the most dangerous combination — those risks
              need attention first.
            </p>
          </div>
        </div>

        <div className="rounded-[22px] border border-gray-200 bg-white p-5 shadow-[0_16px_36px_-24px_rgba(112,144,176,0.25)] dark:border-[var(--border)] dark:bg-[var(--card)] dark:shadow-none">
          <h3 className="mb-3 text-[13.5px] font-bold text-slate-800 dark:text-white">Risk Level Breakdown</h3>
          <div className="space-y-2.5">
            {BAND_ORDER.map((band) => (
              <LegendRow key={band} band={band} count={counts[band]} total={total} />
            ))}
          </div>
          <div className="mt-3 border-t border-slate-100 pt-3 text-[11px] text-slate-400 dark:border-slate-700 dark:text-slate-500">
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
              {ownership.distinctOwners === 1 ? "person" : "people"} — no single owner holds more than half of assigned
              risks in this view.
            </p>
          </div>
        )}
      </div>

      {/* RIGHT — heat map diagram + view switcher */}
      <div className="rounded-[24px] border border-gray-200 bg-white p-6 sm:p-7 shadow-[0_18px_40px_-24px_rgba(112,144,176,0.18)] dark:border-[var(--border)] dark:bg-[var(--card)] dark:shadow-none">
        <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-[16px] font-bold text-slate-800 dark:text-white">Risk Heat Map</h2>
          <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
            {VIEWS.map((v) => {
              const Icon = v.icon;
              return (
                <button
                  key={v.key}
                  type="button"
                  onClick={() => setView(v.key)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-all",
                    view === v.key
                      ? "bg-white text-brand-600 shadow-sm dark:bg-[var(--card)] dark:text-brand-400"
                      : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                  )}
                >
                  <Icon size={13} /> {v.label}
                </button>
              );
            })}
          </div>
        </div>
        <p className="mb-6 text-[12.5px] text-slate-400 dark:text-slate-500">
          Click any point to filter the risk list to that exact combination
        </p>

        {view === "matrix" && (
          <MatrixView grid={grid} selLi={selLi} selIm={selIm} onSelect={onCellSelect} dark={dark} />
        )}
        {view === "bubble" && <BubbleView grid={grid} maxCount={maxCount} onSelect={onCellSelect} />}
        {view === "density" && (
          <DensityView grid={grid} maxCount={maxCount} onSelect={onCellSelect} dark={dark} />
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
      releaseCode: (r) => r.release.releaseCode,
      releaseName: (r) => r.release.name,
      application: (r) => r.applicationName ?? "",
      department: (r) => r.departmentName ?? "",
      prodDate: (r) => r.release.startDate ?? r.release.releaseDate ?? "",
      daysOut: (r) => daysOutFrom(r.release.startDate ?? r.release.releaseDate),
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
      riskOwnerId: (r) => r.riskOwner?.userId ?? "",
    },
  });
  const [allRisks, setAllRisks] = useState<RiskRow[]>([]);

  useEffect(() => {
    return loadJsonEffect<RiskRow[]>("/api/risks", setAllRisks, { label: "risks" });
  }, []);

  const categories = useMemo(() => [...new Set(allRisks.map((r) => r.category))].sort(), [allRisks]);
  const statuses: StatusFilter[] = ["Open", "Monitoring", "Mitigating", "In Progress", "Escalated", "Accepted"];

  const { isColumnVisible, columnPicker, filterPicker, isFilterVisible, prefsLoaded } = useTablePagePreferences(
    "risks",
    RISK_COLUMNS,
    RISK_FILTER_FIELDS,
    {
      lockedKeys: ["riskCode"],
      defaultHiddenFilters: RISK_DEFAULT_HIDDEN_FILTER_KEYS,
    }
  );

  const tablePending = useTablePageLoading(loading, prefsLoaded);

  const visibleColCount = RISK_COLUMNS.filter((c) => isColumnVisible(c.key)).length;

  const onCellSelect = (likelihood: number, impact: number) => {
    setFilters({ likelihood: String(likelihood), impact: String(impact) });
  };

  const onOwnerSelect = (ownerId: string) => {
    // Heatmap deep-links by User cuid; riskWhere accepts cuid OR name contains.
    setFilters({ riskOwnerQ: ownerId, likelihood: "", impact: "" });
  };

  return (
    <div>
      <TopBar
        pageKey="risks"
        trailing={<PageDocumentation pageKey="risks" />}
        title="Risk"
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
          {isFilterVisible("likelihood") && (
            <FilterSelect value={values.likelihood} onChange={(v) => setFilter("likelihood", v)}>
              <option value="">All likelihood</option>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={String(n)}>
                  {n}
                </option>
              ))}
            </FilterSelect>
          )}
          {isFilterVisible("impact") && (
            <FilterSelect value={values.impact} onChange={(v) => setFilter("impact", v)}>
              <option value="">All impact</option>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={String(n)}>
                  {n}
                </option>
              ))}
            </FilterSelect>
          )}
          {isFilterVisible("riskOwnerQ") && (
            <FilterTextInput
              value={values.riskOwnerQ}
              onChange={(v) => setFilter("riskOwnerQ", v)}
              placeholder="Risk owner name or ID…"
            />
          )}
          {isFilterVisible("riskScore") && (
            <div className="inline-flex items-center gap-1">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Score</span>
              <FilterRangeInputs
                minValue={values.riskScoreMin}
                maxValue={values.riskScoreMax}
                onMinChange={(v) => setFilter("riskScoreMin", v)}
                onMaxChange={(v) => setFilter("riskScoreMax", v)}
              />
            </div>
          )}
          {isFilterVisible("riskCodeQ") && (
            <FilterTextInput
              value={values.riskCodeQ}
              onChange={(v) => setFilter("riskCodeQ", v)}
              placeholder="Risk ID…"
            />
          )}
          {isFilterVisible("releaseCodeQ") && (
            <FilterTextInput
              value={values.releaseCodeQ}
              onChange={(v) => setFilter("releaseCodeQ", v)}
              placeholder="Release ID…"
            />
          )}
          {isFilterVisible("releaseNameQ") && (
            <FilterTextInput
              value={values.releaseNameQ}
              onChange={(v) => setFilter("releaseNameQ", v)}
              placeholder="Release name…"
            />
          )}
          {isFilterVisible("applicationQ") && (
            <FilterTextInput
              value={values.applicationQ}
              onChange={(v) => setFilter("applicationQ", v)}
              placeholder="Application…"
            />
          )}
          {isFilterVisible("departmentQ") && (
            <FilterTextInput
              value={values.departmentQ}
              onChange={(v) => setFilter("departmentQ", v)}
              placeholder="Department…"
            />
          )}
          {isFilterVisible("prodDateQ") && (
            <FilterTextInput
              value={values.prodDateQ}
              onChange={(v) => setFilter("prodDateQ", v)}
              placeholder="Prod date (YYYY-MM-DD)…"
            />
          )}
          {isFilterVisible("daysOut") && (
            <div className="inline-flex items-center gap-1">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Days out</span>
              <FilterRangeInputs
                minValue={values.daysOutMin}
                maxValue={values.daysOutMax}
                onMinChange={(v) => setFilter("daysOutMin", v)}
                onMaxChange={(v) => setFilter("daysOutMax", v)}
              />
            </div>
          )}
          {isFilterVisible("descriptionQ") && (
            <FilterTextInput
              value={values.descriptionQ}
              onChange={(v) => setFilter("descriptionQ", v)}
              placeholder="Description…"
            />
          )}
          {isFilterVisible("affectedAreaQ") && (
            <FilterTextInput
              value={values.affectedAreaQ}
              onChange={(v) => setFilter("affectedAreaQ", v)}
              placeholder="Affected area…"
            />
          )}
          {isFilterVisible("mitigationStrategyQ") && (
            <FilterTextInput
              value={values.mitigationStrategyQ}
              onChange={(v) => setFilter("mitigationStrategyQ", v)}
              placeholder="Mitigation…"
            />
          )}
          {isFilterVisible("notesQ") && (
            <FilterTextInput
              value={values.notesQ}
              onChange={(v) => setFilter("notesQ", v)}
              placeholder="Notes…"
            />
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
                  risks.map((r) => {
                    const prodIso = r.release.startDate ?? r.release.releaseDate;
                    return (
                    <tr key={r.id} className={tableRow}>
                      {isColumnVisible("riskCode") && (
                        <td className={`${tableCell} whitespace-nowrap`}>
                          <span className="font-mono text-xs text-brand-600 dark:text-brand-400">{r.riskCode}</span>
                        </td>
                      )}
                      {isColumnVisible("releaseCode") && (
                        <td className={`${tableCell} whitespace-nowrap`}>
                          <ProgressLink
                            href={`/releases/${r.release.id}`}
                            className="text-brand-600 dark:text-brand-400 hover:underline font-mono text-xs"
                          >
                            {r.release.releaseCode}
                          </ProgressLink>
                        </td>
                      )}
                      {isColumnVisible("releaseName") && (
                        <td className={`${tableCell} max-w-[220px] truncate`} title={r.release.name}>
                          {r.release.name}
                        </td>
                      )}
                      {isColumnVisible("application") && (
                        <td className={`${tableCell} whitespace-nowrap`}>{r.applicationName ?? "—"}</td>
                      )}
                      {isColumnVisible("department") && (
                        <td className={`${tableCell} whitespace-nowrap`}>{r.departmentName ?? "—"}</td>
                      )}
                      {isColumnVisible("prodDate") && (
                        <td className={`${tableCell} whitespace-nowrap`}>{prodIso ? formatDate(prodIso) : "—"}</td>
                      )}
                      {isColumnVisible("daysOut") && (
                        <td className={`${tableCell} text-center whitespace-nowrap`}>{daysOutFrom(prodIso)}</td>
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
                          {r.riskOwner?.name ?? "—"}
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
                      {isColumnVisible("riskOwnerId") && (
                        <td className={`${tableCell} whitespace-nowrap font-mono text-xs text-gray-600 dark:text-gray-300`}>
                          {r.riskOwner?.userId ?? "—"}
                        </td>
                      )}
                    </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </DataTable>
      )}
    </div>
  );
}
