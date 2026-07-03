import type { Release, ReleaseDecision } from "./types";
import { calcReadiness, getBlockers } from "./utils";

export interface ReleaseYesterdaySnapshot {
  capturedAt: string;
  readiness: number;
  blockers: string[];
  decision: Release["decision"];
  status: Release["status"];
  pendingGates: string[];
  buildStatus: Release["build"]["status"];
  structuredChanges: string[];
}

/** Simulated 24h-ago state for demo — derived from anchor release profiles */
export function getYesterdaySnapshot(release: Release): ReleaseYesterdaySnapshot {
  const capturedAt = new Date(Date.now() - 86400000).toISOString();
  const now = calcReadiness(release);
  const blockers = getBlockers(release);
  const pendingGates = release.approvals.filter((a) => a.status === "Pending").map((a) => a.gate);

  const profiles: Record<string, Partial<ReleaseYesterdaySnapshot>> = {
    "rel-v2140": {
      readiness: Math.max(0, now - 12),
      blockers: [...blockers, "Build still running"],
      pendingGates: [...pendingGates, "Database"],
      buildStatus: "Running",
      structuredChanges: [
        "Readiness improved 12 points (build completed overnight)",
        "Database gate approved since yesterday",
        "Build moved from Running → Passed",
        "Security gate still pending (no change)",
        "Risk Agent flagged file volume yesterday — still open",
      ],
    },
    "rel-v2141": {
      readiness: now - 5,
      blockers: ["Ticket MOB-302 still In Progress"],
      pendingGates: ["Security", "Change"],
      buildStatus: "Running",
      structuredChanges: [
        "QA and Business gates approved in last 24h",
        "Build completed — all tests green",
        "Readiness up 5 points",
        "No blockers remain",
      ],
    },
    "rel-v2135": {
      readiness: now + 8,
      blockers: ["Waiting on QA sign-off"],
      pendingGates: ["QA"],
      buildStatus: "Passed",
      structuredChanges: [
        "Build regressed — 22 integration test failures detected",
        "QA gate rejected after failed build",
        "Readiness dropped 8 points",
        "Invoice rounding ticket still blocked",
      ],
    },
  };

  const profile = profiles[release.id];
  if (profile) {
    return {
      capturedAt,
      readiness: profile.readiness ?? now,
      blockers: profile.blockers ?? blockers,
      decision: release.decision,
      status: release.status,
      pendingGates: profile.pendingGates ?? pendingGates,
      buildStatus: profile.buildStatus ?? release.build.status,
      structuredChanges: profile.structuredChanges ?? [],
    };
  }

  return {
    capturedAt,
    readiness: Math.max(0, now - 6),
    blockers: blockers.slice(0, Math.max(1, blockers.length)),
    decision: release.decision,
    status: release.status,
    pendingGates,
    buildStatus: release.build.status === "Passed" ? "Running" : release.build.status,
    structuredChanges: [
      `Readiness changed ~6 points since yesterday`,
      `${pendingGates.length} approval gate(s) still pending`,
      blockers.length > 0 ? `${blockers.length} blocker(s) tracked` : "No blockers yesterday",
    ],
  };
}

export function getCurrentSnapshotSummary(release: Release, liveDecision?: ReleaseDecision | null) {
  return {
    readiness: calcReadiness(release),
    blockers: getBlockers(release),
    decision: liveDecision !== undefined ? liveDecision : release.decision,
    status: release.status,
    pendingGates: release.approvals.filter((a) => a.status === "Pending").map((a) => a.gate),
    buildStatus: release.build.status,
    approvedGates: release.approvals.filter((a) => a.status === "Approved").map((a) => a.gate),
  };
}
