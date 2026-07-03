import type { Release, ReleasePrediction, TeamRiskCell, ForecastTrendPoint } from "./types";
import { calcReadiness, getBlockers, isFriday } from "./utils";

const MODEL_VERSION = "sentinel-rm-v1.2";

function clamp(n: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, Math.round(n)));
}

export function predictRelease(release: Release, servicesUnstable: Set<string>): ReleasePrediction {
  const readiness = calcReadiness(release);
  const blockers = getBlockers(release);
  const target = new Date(release.targetDate);

  let shipSuccess = readiness * 0.85 + 10;
  const factors: ReleasePrediction["factors"] = [];

  factors.push({
    label: `Readiness score ${readiness}%`,
    impact: Math.round(readiness * 0.4),
    direction: readiness >= 70 ? "up" : "down",
  });

  if (blockers.length > 0) {
    const penalty = blockers.length * 8;
    shipSuccess -= penalty;
    factors.push({ label: `${blockers.length} open blocker(s)`, impact: penalty, direction: "down" });
  }

  if (release.filesChanged > 400) {
    shipSuccess -= 12;
    factors.push({ label: "High change volume", impact: 12, direction: "down" });
  }

  if (isFriday(target)) {
    shipSuccess -= 14;
    factors.push({ label: "Friday deploy window", impact: 14, direction: "down" });
  }

  const touchesUnstable = release.dependsOnServices.some((id) => servicesUnstable.has(id));
  if (touchesUnstable) {
    shipSuccess -= 10;
    factors.push({ label: "Unstable dependency", impact: 10, direction: "down" });
  }

  if (release.build.status === "Failed") {
    shipSuccess -= 25;
    factors.push({ label: "Build failing", impact: 25, direction: "down" });
  } else if (release.build.status === "Running") {
    shipSuccess -= 8;
    factors.push({ label: "Build in progress", impact: 8, direction: "down" });
  }

  const pendingSecurity = release.approvals.find((a) => a.gate === "Security" && a.status === "Pending");
  if (pendingSecurity) {
    shipSuccess -= 15;
    factors.push({ label: "Security gate pending", impact: 15, direction: "down" });
  }

  shipSuccess = clamp(shipSuccess);

  let rollbackRisk = 100 - shipSuccess;
  if (isFriday(target)) rollbackRisk += 8;
  if (release.filesChanged > 800) rollbackRisk += 6;
  rollbackRisk = clamp(rollbackRisk * 0.45);

  let delayRisk = blockers.length * 12;
  if (release.status === "At Risk") delayRisk += 20;
  if (release.status === "Blocked") delayRisk += 35;
  delayRisk = clamp(delayRisk);

  const dataPoints =
    release.approvals.length + release.tickets.length + release.commits.length + (release.changeRecord ? 1 : 0);
  const confidence = clamp(55 + dataPoints * 2 + (release.build.status === "Passed" ? 10 : 0), 60, 94);

  return {
    releaseId: release.id,
    version: release.version,
    team: release.team,
    targetDate: release.targetDate,
    shipSuccessPct: shipSuccess,
    rollbackRiskPct: rollbackRisk,
    delayRiskPct: delayRisk,
    confidence,
    factors: factors.slice(0, 5),
    modelVersion: MODEL_VERSION,
  };
}

export function predictAllReleases(
  releases: Release[],
  unstableServiceIds: string[]
): ReleasePrediction[] {
  const unstable = new Set(unstableServiceIds);
  return releases
    .filter((r) => r.status !== "Shipped")
    .map((r) => predictRelease(r, unstable))
    .sort((a, b) => a.shipSuccessPct - b.shipSuccessPct);
}

export function getTeamRiskHeatmap(releases: Release[]): TeamRiskCell[] {
  const teams = new Map<string, Release[]>();
  releases.forEach((r) => {
    if (r.status === "Shipped") return;
    const list = teams.get(r.team) ?? [];
    list.push(r);
    teams.set(r.team, list);
  });

  return Array.from(teams.entries())
    .map(([team, list]) => {
      const avgReadiness = Math.round(list.reduce((s, r) => s + calcReadiness(r), 0) / list.length);
      const atRisk = list.filter((r) => r.status === "At Risk").length;
      const blocked = list.filter((r) => r.status === "Blocked").length;
      const blockerLoad = list.reduce((s, r) => s + getBlockers(r).length, 0);
      const riskScore = clamp(blocked * 25 + atRisk * 18 + (100 - avgReadiness) * 0.4 + blockerLoad * 3);
      return { team, riskScore, active: list.length, atRisk, blocked, avgReadiness };
    })
    .sort((a, b) => b.riskScore - a.riskScore);
}

export function getPortfolioStats(releases: Release[], predictions: ReleasePrediction[]) {
  const active = releases.filter((r) => r.status !== "Shipped");
  const atRisk = active.filter((r) => r.status === "At Risk" || r.status === "Blocked");
  const avgReadiness =
    active.length === 0
      ? 0
      : Math.round(active.reduce((s, r) => s + calcReadiness(r), 0) / active.length);
  const avgShipSuccess =
    predictions.length === 0
      ? 0
      : Math.round(predictions.reduce((s, p) => s + p.shipSuccessPct, 0) / predictions.length);
  const highRollback = predictions.filter((p) => p.rollbackRiskPct >= 25).length;
  const thisWeek = active.filter((r) => {
    const d = new Date(r.targetDate);
    const now = new Date();
    const week = new Date(now);
    week.setDate(week.getDate() + 7);
    return d >= now && d <= week;
  });

  return {
    activeCount: active.length,
    atRiskCount: atRisk.length,
    avgReadiness,
    avgShipSuccess,
    highRollbackCount: highRollback,
    shippingThisWeek: thisWeek.length,
  };
}

export function buildForecastTrend(
  historical: { week: string; avgReadiness: number; rollbackCount: number }[]
): ForecastTrendPoint[] {
  const recent = historical.slice(-8);
  const last = recent[recent.length - 1];
  const avgDelta =
    recent.length >= 2
      ? (recent[recent.length - 1].avgReadiness - recent[0].avgReadiness) / (recent.length - 1)
      : 0;

  const points: ForecastTrendPoint[] = recent.map((h, idx) => ({
    week: h.week.slice(5),
    actualReadiness: Math.round(h.avgReadiness),
    predictedReadiness: Math.round(h.avgReadiness + ((idx % 3) - 1) * 2),
    predictedRollbacks: h.rollbackCount,
    isForecast: false,
  }));

  for (let i = 1; i <= 4; i++) {
    const d = new Date(last.week);
    d.setDate(d.getDate() + i * 7);
    const predicted = clamp(last.avgReadiness + avgDelta * i - (i === 2 ? 3 : 0));
    points.push({
      week: d.toISOString().slice(5),
      predictedReadiness: predicted,
      predictedRollbacks: i === 2 ? 3 : i === 4 ? 2 : 1,
      isForecast: true,
    });
  }

  return points;
}

export function getRiskColor(score: number): string {
  if (score >= 70) return "bg-error-500";
  if (score >= 45) return "bg-warning-500";
  if (score >= 25) return "bg-amber-400";
  return "bg-success-500";
}

export function getRiskTextColor(score: number): string {
  if (score >= 70) return "text-error-600";
  if (score >= 45) return "text-warning-600";
  if (score >= 25) return "text-amber-600";
  return "text-success-600";
}
