import type { DeploymentPhase, EnvironmentPromotion, Release } from "./types";

const REGIONS: EnvironmentPromotion["region"][] = ["us-east-1", "eu-west-1", "ap-southeast-2"];

function parseVersion(v: string): number[] {
  return v.replace(/^v/, "").split(".").map(Number);
}

function versionLt(a: string, b: string): boolean {
  const pa = parseVersion(a);
  const pb = parseVersion(b);
  for (let i = 0; i < 3; i++) {
    if ((pa[i] ?? 0) < (pb[i] ?? 0)) return true;
    if ((pa[i] ?? 0) > (pb[i] ?? 0)) return false;
  }
  return false;
}

function priorPatch(version: string): string {
  const parts = parseVersion(version);
  if (parts[2] > 0) return `v${parts[0]}.${parts[1]}.${parts[2] - 1}`;
  if (parts[1] > 0) return `v${parts[0]}.${parts[1] - 1}.9`;
  return `v${parts[0] - 1}.9.9`;
}

export function buildEnvironmentPromotions(
  release: Release,
  deployPhase?: DeploymentPhase
): EnvironmentPromotion[] {
  if (release.environmentPromotions?.length) return release.environmentPromotions;

  const prev = priorPatch(release.version);
  const isShipped = release.status === "Shipped";
  const isProdTarget = release.deployment?.environment === "production";
  const rolling =
    deployPhase === "In Progress" || deployPhase === "Verifying";
  const rolled = deployPhase === "Rolled Back";
  const verified = deployPhase === "Verified" || isShipped;

  return REGIONS.flatMap((region) => {
    const dev: EnvironmentPromotion = {
      environment: "dev",
      region,
      version: release.version,
      status: "live",
      deployedAt: release.history[0]?.timestamp,
    };

    const staging: EnvironmentPromotion = {
      environment: "staging",
      region,
      version: isShipped || verified ? release.version : versionLt(prev, release.version) ? release.version : prev,
      status:
        rolling && !isProdTarget
          ? "deploying"
          : release.status === "Blocked"
            ? "failed"
            : "live",
      deployedAt: release.build.lastRun,
    };

    const prod: EnvironmentPromotion = {
      environment: "prod",
      region,
      version: verified || isShipped ? release.version : prev,
      status: rolled
        ? "rolled-back"
        : rolling && isProdTarget
          ? "deploying"
          : verified || isShipped
            ? "live"
            : release.status === "Ready"
              ? "pending"
              : "pending",
      deployedAt: verified || isShipped ? release.targetDate : undefined,
    };

    return [dev, staging, prod];
  });
}

export function getPromotionSummary(promotions: EnvironmentPromotion[]) {
  const prod = promotions.filter((p) => p.environment === "prod");
  const live = prod.filter((p) => p.status === "live").length;
  const pending = prod.filter((p) => p.status === "pending").length;
  const deploying = prod.filter((p) => p.status === "deploying").length;
  return { live, pending, deploying, regions: prod.length };
}
