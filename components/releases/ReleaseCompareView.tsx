"use client";

import { ProgressLink } from "@/components/layout/NavigationProgress";
import { StatusBadge } from "@/components/badges/StatusBadge";
import { AdvancedCard } from "@/components/ui/advanced-card";
import type { ReleaseCompareSnapshot } from "@/lib/release-comparison";
import { compareMetric } from "@/lib/release-comparison";
import { cn } from "@/lib/utils";
import { AlertTriangle, CheckCircle2, Minus } from "lucide-react";

function DeltaBadge({ side }: { side: "better" | "worse" | "neutral" }) {
  if (side === "neutral") return <Minus className="w-3.5 h-3.5 text-gray-400" />;
  if (side === "better") return <CheckCircle2 className="w-3.5 h-3.5 text-success-500" />;
  return <AlertTriangle className="w-3.5 h-3.5 text-error-500" />;
}

function CompareColumn({
  snapshot,
  accent,
}: {
  snapshot: ReleaseCompareSnapshot;
  accent: "left" | "right";
}) {
  return (
    <AdvancedCard
      variant={accent === "left" ? "ai" : "glass"}
      className="h-full relative overflow-hidden group"
      innerClassName="p-6 flex flex-col h-full"
    >
      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
        {accent === "left" ? <Minus className="w-24 h-24" /> : <CheckCircle2 className="w-24 h-24" />}
      </div>
      
      <div className="mb-6 relative z-10">
        <ProgressLink href={`/releases/${snapshot.releaseId}`} className="text-2xl font-black text-brand-600 dark:text-brand-400 hover:text-brand-700 tracking-tight flex items-center gap-2">
          {snapshot.version}
        </ProgressLink>
        <p className="text-base font-medium text-gray-700 dark:text-gray-200 mt-1">{snapshot.name}</p>
        <p className="text-sm font-semibold text-brand-500 uppercase tracking-widest mt-0.5">{snapshot.team}</p>
        <div className="flex flex-wrap gap-2 mt-4">
          <StatusBadge status={snapshot.status} />
          {snapshot.decision && <StatusBadge status={snapshot.decision} />}
        </div>
      </div>

      <div className="space-y-5 text-sm flex-grow relative z-10">
        <div>
          <div className="flex justify-between items-end mb-1.5">
            <span className="text-gray-500 dark:text-gray-400 font-semibold text-[11px] uppercase tracking-wider">Readiness</span>
            <span className="text-lg font-bold text-gray-900 dark:text-white font-mono leading-none">{snapshot.readiness}%</span>
          </div>
          <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div className={cn("h-full rounded-full transition-all duration-1000", snapshot.readiness >= 90 ? "bg-success-500" : snapshot.readiness >= 70 ? "bg-amber-500" : "bg-error-500")} style={{ width: `${snapshot.readiness}%` }} />
          </div>
        </div>
        
        <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
          <span className="text-gray-500 dark:text-gray-400 font-semibold text-[11px] uppercase tracking-wider">Approvals</span>
          <span className="font-medium bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-gray-800 dark:text-gray-200">{snapshot.approvedGates} / {snapshot.totalGates}</span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
          <span className="text-gray-500 dark:text-gray-400 font-semibold text-[11px] uppercase tracking-wider">Build</span>
          <StatusBadge status={snapshot.buildStatus} />
        </div>
        <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
          <span className="text-gray-500 dark:text-gray-400 font-semibold text-[11px] uppercase tracking-wider">Files changed</span>
          <span className="font-medium font-mono text-[13px] bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 px-2 py-0.5 rounded">{snapshot.filesChanged}</span>
        </div>
        {snapshot.shipSuccessPct != null && (
          <div>
            <div className="flex justify-between items-end mb-1.5 mt-2">
              <span className="text-gray-500 dark:text-gray-400 font-semibold text-[11px] uppercase tracking-wider">ML ship success</span>
              <span className="text-lg font-bold text-gray-900 dark:text-white font-mono leading-none">{snapshot.shipSuccessPct}%</span>
            </div>
            <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full bg-brand-500 rounded-full transition-all duration-1000" style={{ width: `${snapshot.shipSuccessPct}%` }} />
            </div>
          </div>
        )}
        {snapshot.rollbackRiskPct != null && (
          <div className="flex justify-between items-center py-2 pt-4">
            <span className="text-gray-500 dark:text-gray-400 font-semibold text-[11px] uppercase tracking-wider">ML rollback risk</span>
            <span className="font-bold font-mono text-[14px] text-error-600 dark:text-error-400 bg-error-50 dark:bg-error-500/10 px-2 py-0.5 rounded">{snapshot.rollbackRiskPct}%</span>
          </div>
        )}
      </div>

      <div className="mt-6 relative z-10">
        {snapshot.blockers.length === 0 ? (
          <div className="rounded-xl border border-success-200/50 dark:border-success-500/20 bg-success-50/50 dark:bg-success-500/5 p-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-success-100 dark:bg-success-500/20 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4 text-success-600 dark:text-success-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-success-900 dark:text-success-400">Clear to ship</p>
              <p className="text-xs text-success-700/80 dark:text-success-500/80 mt-0.5">No active blockers</p>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-error-200/50 dark:border-error-500/20 bg-error-50/50 dark:bg-error-500/5 p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-error-500" />
              <p className="text-sm font-bold text-error-900 dark:text-error-400">Blockers ({snapshot.blockers.length})</p>
            </div>
            <ul className="space-y-2">
              {snapshot.blockers.map((b) => (
                <li key={b} className="text-[13px] font-medium text-error-800 dark:text-error-300 flex items-start gap-2 bg-white/40 dark:bg-black/20 p-2 rounded-lg">
                  <div className="w-1.5 h-1.5 rounded-full bg-error-400 shrink-0 mt-1.5" />
                  {b}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </AdvancedCard>
  );
}

export function ReleaseCompareView({
  left,
  right,
}: {
  left: ReleaseCompareSnapshot;
  right: ReleaseCompareSnapshot;
}) {
  const rows = [
    {
      label: "Readiness",
      leftVal: left.readiness,
      rightVal: right.readiness,
      higherBetter: true,
      fmt: (v: number) => `${v}%`,
    },
    {
      label: "Open blockers",
      leftVal: left.blockers.length,
      rightVal: right.blockers.length,
      higherBetter: false,
      fmt: (v: number) => String(v),
    },
    {
      label: "Pending approvals",
      leftVal: left.pendingApprovals,
      rightVal: right.pendingApprovals,
      higherBetter: false,
      fmt: (v: number) => String(v),
    },
    {
      label: "Files changed",
      leftVal: left.filesChanged,
      rightVal: right.filesChanged,
      higherBetter: false,
      fmt: (v: number) => String(v),
    },
    ...(left.shipSuccessPct != null && right.shipSuccessPct != null
      ? [
          {
            label: "ML ship success",
            leftVal: left.shipSuccessPct,
            rightVal: right.shipSuccessPct,
            higherBetter: true,
            fmt: (v: number) => `${v}%`,
          },
        ]
      : []),
  ];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_auto_1fr] gap-6 items-stretch">
      <CompareColumn snapshot={left} accent="left" />

      <AdvancedCard variant="plain" className="hidden xl:block xl:w-[280px]" innerClassName="p-0 flex flex-col h-full bg-gray-50/30 dark:bg-gray-900/30 border-x border-gray-100 dark:border-gray-800">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-white/40 dark:bg-gray-800/20">
          <p className="text-[10px] font-black tracking-[0.2em] uppercase text-gray-400 dark:text-gray-500 text-center">Comparison</p>
        </div>
        <div className="space-y-0 flex-grow flex flex-col justify-center">
          {rows.map((row, i) => {
            const leftSide = compareMetric(row.leftVal, row.rightVal, row.higherBetter);
            const rightSide = compareMetric(row.rightVal, row.leftVal, row.higherBetter);
            return (
              <div key={row.label} className={cn("text-center p-4 relative group", i !== rows.length - 1 && "border-b border-gray-100 dark:border-gray-800")}>
                <div className="absolute inset-0 bg-white/40 dark:bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-widest">{row.label}</p>
                <div className="flex items-center justify-between px-2">
                  <div className={cn("flex flex-col items-center flex-1 rounded-lg py-1.5 px-2", leftSide === "better" ? "bg-success-50 dark:bg-success-500/10 text-success-700 dark:text-success-400" : leftSide === "worse" ? "bg-error-50 dark:bg-error-500/10 text-error-700 dark:text-error-400" : "text-gray-600 dark:text-gray-400")}>
                    <DeltaBadge side={leftSide} />
                    <span className="font-mono text-xs font-bold mt-1">{row.fmt(row.leftVal)}</span>
                  </div>
                  
                  <div className="px-4 text-[10px] font-bold text-gray-300 dark:text-gray-600 uppercase tracking-widest">VS</div>
                  
                  <div className={cn("flex flex-col items-center flex-1 rounded-lg py-1.5 px-2", rightSide === "better" ? "bg-success-50 dark:bg-success-500/10 text-success-700 dark:text-success-400" : rightSide === "worse" ? "bg-error-50 dark:bg-error-500/10 text-error-700 dark:text-error-400" : "text-gray-600 dark:text-gray-400")}>
                    <DeltaBadge side={rightSide} />
                    <span className="font-mono text-xs font-bold mt-1">{row.fmt(row.rightVal)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </AdvancedCard>

      <CompareColumn snapshot={right} accent="right" />
    </div>
  );
}
