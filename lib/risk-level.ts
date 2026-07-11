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
  LOW: "bg-[#d1fae5] text-[#065f46] dark:bg-emerald-500/25 dark:text-emerald-300",
  MEDIUM: "bg-[#fef9c3] text-[#854d0e] dark:bg-yellow-500/25 dark:text-yellow-300",
  HIGH: "bg-[#fed7aa] text-[#9a3412] dark:bg-orange-500/30 dark:text-orange-300",
  CRITICAL: "bg-[#fecaca] text-[#7f1d1d] dark:bg-red-500/30 dark:text-red-300",
};
