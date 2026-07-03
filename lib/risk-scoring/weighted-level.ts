/**
 * Weighted Risk Score (System 2) — confirmed bands from the source Excel formula.
 * These differ from the Simple Risk Score bands (System 1) and are NOT the
 * outdated README table.
 */
export type WeightedRiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | "SEVERE";

export function getWeightedRiskLevel(score: number): WeightedRiskLevel {
  if (score < 1.5) return "LOW";
  if (score < 2.5) return "MEDIUM";
  if (score < 3.5) return "HIGH";
  if (score < 4.0) return "CRITICAL";
  return "SEVERE";
}

export const WEIGHTED_RISK_LEVEL_COLOR: Record<WeightedRiskLevel, string> = {
  LOW: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300",
  MEDIUM: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300",
  HIGH: "bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-300",
  CRITICAL: "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300",
  SEVERE: "bg-red-200 text-red-900 dark:bg-red-500/30 dark:text-red-200",
};
