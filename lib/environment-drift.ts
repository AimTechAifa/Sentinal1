/** Normalize env version strings for comparison (strip v prefix, -dev suffix). */
export function normalizeEnvVersion(version: string): string {
  return version.replace(/^v/i, "").replace(/-dev$/i, "").trim();
}

function parseParts(version: string): number[] {
  return normalizeEnvVersion(version)
    .split(".")
    .map((p) => parseInt(p, 10) || 0);
}

function compareEnvVersion(a: string, b: string): number {
  const pa = parseParts(a);
  const pb = parseParts(b);
  for (let i = 0; i < 3; i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

/** True when two or more env tiers exist and their normalized versions differ. */
export function hasVersionDrift(dev: string, test: string, prod: string): boolean {
  const tiers = [dev, test, prod].filter((v) => v && v !== "—");
  if (tiers.length < 2) return false;
  const normalized = tiers.map(normalizeEnvVersion);
  return !normalized.every((v) => v === normalized[0]);
}

/** Align all tiers to the highest version after drift remediation. */
export function alignVersionsPostRemediation(dev: string, test: string, prod: string): {
  dev: string;
  test: string;
  prod: string;
  promotionPct: number;
} {
  if (!hasVersionDrift(dev, test, prod)) {
    return {
      dev,
      test,
      prod,
      promotionPct: prod !== "—" && normalizeEnvVersion(dev) === normalizeEnvVersion(prod) ? 100 : test === prod ? 66 : 33,
    };
  }

  const tiers = [dev, test, prod].filter((v) => v && v !== "—");
  const canonical = tiers.reduce((best, cur) => (compareEnvVersion(cur, best) > 0 ? cur : best));

  return { dev: canonical, test: canonical, prod: canonical, promotionPct: 100 };
}
