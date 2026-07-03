"use client";

import { AlertTriangle, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DbReleasePrediction } from "@/lib/db-predictive";

const SEVERITY_STYLES = {
  low: "border-gray-200 bg-gray-50/80 text-gray-700",
  medium: "border-amber-200 bg-amber-50/70 text-amber-900",
  high: "border-error-200 bg-error-50/70 text-error-900",
};

export function DbPredictiveNudge({ prediction }: { prediction: DbReleasePrediction }) {
  if (prediction.severity === "low" && prediction.delayRisk < 30) return null;

  const Icon = prediction.severity === "high" ? AlertTriangle : TrendingDown;

  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-xl border px-4 py-3 text-sm",
        SEVERITY_STYLES[prediction.severity]
      )}
    >
      <Icon className="h-4 w-4 shrink-0 mt-0.5" />
      <div>
        <p className="font-medium">Predictive nudge</p>
        <p className="text-xs mt-0.5 opacity-90">{prediction.nudge}</p>
        <p className="text-[10px] mt-1 opacity-70">
          Ship {prediction.shipProbability}% · Slip risk {prediction.delayRisk}%
        </p>
      </div>
    </div>
  );
}
