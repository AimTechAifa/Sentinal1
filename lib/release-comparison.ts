import type { Release, ReleaseDecision, ReleasePrediction } from "./types";
import { calcReadiness, getBlockers } from "./utils";

export interface ReleaseCompareSnapshot {
  releaseId: string;
  version: string;
  name: string;
  team: string;
  status: Release["status"];
  decision: Release["decision"];
  readiness: number;
  blockers: string[];
  pendingApprovals: number;
  approvedGates: number;
  totalGates: number;
  buildStatus: Release["build"]["status"];
  filesChanged: number;
  shipSuccessPct?: number;
  rollbackRiskPct?: number;
}

export function buildCompareSnapshot(
  release: Release,
  prediction?: ReleasePrediction,
  liveDecision?: ReleaseDecision | null
): ReleaseCompareSnapshot {
  const approved = release.approvals.filter((a) => a.status === "Approved").length;
  const decision = liveDecision !== undefined ? liveDecision : release.decision;
  return {
    releaseId: release.id,
    version: release.version,
    name: release.name,
    team: release.team,
    status: release.status,
    decision,
    readiness: calcReadiness(release),
    blockers: getBlockers(release),
    pendingApprovals: release.approvals.filter((a) => a.status === "Pending").length,
    approvedGates: approved,
    totalGates: release.approvals.length,
    buildStatus: release.build.status,
    filesChanged: release.filesChanged,
    shipSuccessPct: prediction?.shipSuccessPct,
    rollbackRiskPct: prediction?.rollbackRiskPct,
  };
}

export function compareMetric(
  left: number | undefined,
  right: number | undefined,
  higherIsBetter = true
): "better" | "worse" | "neutral" {
  if (left == null || right == null) return "neutral";
  if (left === right) return "neutral";
  const leftBetter = higherIsBetter ? left > right : left < right;
  return leftBetter ? "better" : "worse";
}

export const COMPARE_PRESETS: { label: string; leftId: string; rightId: string }[] = [
  { label: "At risk vs healthy", leftId: "rel-v2140", rightId: "rel-v2141" },
  { label: "Blocked vs ready", leftId: "rel-v2135", rightId: "rel-v2141" },
  { label: "Large vs small change", leftId: "rel-v2150", rightId: "rel-v2141" },
];
