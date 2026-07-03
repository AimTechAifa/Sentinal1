"use client";

import type { TeamRiskCell } from "@/lib/types";
import { getRiskColor, getRiskTextColor } from "@/lib/predictive";
import { AdvancedCard } from "@/components/ui/advanced-card";
import { cn } from "@/lib/utils";
import { Flame } from "lucide-react";

export function TeamRiskHeatmap({ data }: { data: TeamRiskCell[] }) {
  return (
    <AdvancedCard
      title="Team Risk Heatmap"
      subtitle="Composite risk from blockers, readiness, and release status"
      icon={Flame}
      variant="glass"
    >
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {data.map((cell) => (
          <div
            key={cell.team}
            className="rounded-xl border border-gray-100/80 bg-white/60 p-3 hover:shadow-theme-sm hover:border-brand-100 transition-all backdrop-blur-sm"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-800">{cell.team}</span>
              <span className={cn("text-lg font-bold font-mono text-[10px] uppercase tracking-wider", getRiskTextColor(cell.riskScore))}>
                {cell.riskScore}
              </span>
            </div>
            <div className="h-2 rounded-full bg-gray-100 overflow-hidden mb-2">
              <div
                className={cn("h-full rounded-full transition-all", getRiskColor(cell.riskScore))}
                style={{ width: `${cell.riskScore}%` }}
              />
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-gray-500">
              <span>{cell.active} active</span>
              {cell.atRisk > 0 && <span className="text-warning-600">{cell.atRisk} at risk</span>}
              {cell.blocked > 0 && <span className="text-error-600">{cell.blocked} blocked</span>}
              <span>{cell.avgReadiness}% ready</span>
            </div>
          </div>
        ))}
      </div>
    </AdvancedCard>
  );
}
