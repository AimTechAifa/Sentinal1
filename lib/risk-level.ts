/**
 * Simple Risk Score (System 1) — derived banding for Risk.riskScore (likelihood × impact, range 1-25).
 * Bands are a display/filtering concern only — never stored as a column.
 *
 * Bands sourced from the Risk sheet's own embedded Summary Statistics box
 * (cross-checked against all 31 real risk scores — exact match: Low=3,
 * Medium=15, High=11, Critical=2). Supersedes an earlier prose-derived
 * reading of the bands that produced a different (incorrect) split.
 */
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export function getRiskLevel(score: number): RiskLevel {
  if (score <= 5) return "LOW";
  if (score <= 11) return "MEDIUM";
  if (score <= 19) return "HIGH";
  return "CRITICAL";
}

export const RISK_LEVEL_COLOR: Record<RiskLevel, string> = {
  LOW: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300",
  MEDIUM: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300",
  HIGH: "bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-300",
  CRITICAL: "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300",
};
