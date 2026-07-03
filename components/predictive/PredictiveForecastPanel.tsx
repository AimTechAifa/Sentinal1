"use client";

import { useEffect, useState } from "react";
import { ProgressLink } from "@/components/layout/NavigationProgress";
import { AgentBadge } from "@/components/badges/AgentBadge";
import { AICardSkeleton } from "@/components/ui/AISkeleton";
import { ForecastChart } from "@/components/predictive/ForecastChart";
import { callAgent } from "@/lib/agent-client";
import { historicalTrend } from "@/lib/dummy-data";
import type { ReleasePrediction } from "@/lib/types";
import { buildForecastTrend, getRiskTextColor } from "@/lib/predictive";
import { AdvancedCard } from "@/components/ui/advanced-card";
import { cn } from "@/lib/utils";
import { Brain, ChevronDown, ChevronUp } from "lucide-react";

interface PredictiveForecastPanelProps {
  predictions: ReleasePrediction[];
  compact?: boolean;
}

export function PredictiveForecastPanel({ predictions, compact }: PredictiveForecastPanelProps) {
  const [narrative, setNarrative] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(!compact);
  const forecastData = buildForecastTrend(historicalTrend);
  const topRisk = [...predictions].sort((a, b) => b.rollbackRiskPct - a.rollbackRiskPct).slice(0, 5);

  useEffect(() => {
    callAgent({
      agentRole: "Risk Agent",
      context: {
        mode: "forecast",
        predictions: topRisk,
        historicalTrend: historicalTrend.slice(-6),
      },
      mode: "prose",
    }).then((res) => {
      setNarrative(res.text ?? null);
      setLoading(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [predictions.length]);

  return (
    <div className="space-y-6">
      <ForecastChart data={forecastData} />

      <AdvancedCard
        title="Release Outcome Predictions"
        icon={Brain}
        variant="ai"
        action={
          <div className="flex items-center gap-2">
            <AgentBadge agent="Risk Agent" />
            {compact && (
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="text-xs text-brand-500 flex items-center gap-1"
              >
                {expanded ? "Collapse" : "Expand"}
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            )}
          </div>
        }
      >
        {loading ? (
          <AICardSkeleton />
        ) : (
          narrative && (
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">{narrative}</p>
          )
        )}

        {expanded && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {topRisk.map((p) => (
              <div key={p.releaseId} className="rounded-xl border border-gray-100 p-4 bg-white/80">
                <div className="flex items-center justify-between mb-2">
                  <ProgressLink href={`/releases/${p.releaseId}`} className="font-medium text-brand-500 text-sm hover:underline">
                    {p.version}
                  </ProgressLink>
                  <span className="text-[10px] text-gray-400">{p.modelVersion}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center mb-3">
                  <div>
                    <p className="text-[10px] text-gray-500">Ship</p>
                    <p className={cn("text-sm font-bold", getRiskTextColor(100 - p.shipSuccessPct))}>
                      {p.shipSuccessPct}%
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500">Rollback</p>
                    <p className={cn("text-sm font-bold", getRiskTextColor(p.rollbackRiskPct))}>
                      {p.rollbackRiskPct}%
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500">Delay</p>
                    <p className="text-sm font-bold text-gray-700">{p.delayRiskPct}%</p>
                  </div>
                </div>
                <ul className="space-y-1">
                  {p.factors.slice(0, 3).map((f) => (
                    <li key={f.label} className="text-[10px] text-gray-500 flex justify-between">
                      <span>{f.label}</span>
                      <span className={f.direction === "down" ? "text-error-500" : "text-success-500"}>
                        {f.direction === "down" ? "−" : "+"}
                        {f.impact}%
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </AdvancedCard>
    </div>
  );
}
