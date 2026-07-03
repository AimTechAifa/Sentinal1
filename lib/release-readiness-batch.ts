import { calcDbReadiness, getDbBlockers } from "./db-release-command";
import { releases as demoReleases } from "./dummy-data";
import { calcReadiness, getBlockers } from "./utils";

export type ReleaseReadinessSummary = {
  key: string;
  id: string;
  source: "database" | "demo";
  readiness: number;
  blockerCount: number;
};

export function readinessKey(source: "database" | "demo", id: string): string {
  return `${source}:${id}`;
}

export async function buildDbReadinessSummaries(
  prisma: typeof import("./prisma").prisma
): Promise<ReleaseReadinessSummary[]> {
  const [releases, p1Issues] = await Promise.all([
    prisma.release.findMany({
      include: {
        applications: { include: { application: true } },
        dependsOn: { include: { dependsOnRelease: true } },
        bookings: { include: { application: true } },
      },
    }),
    prisma.p1Issue.findMany(),
  ]);

  const p1ByCode = new Map<string, typeof p1Issues>();
  p1Issues.forEach((p) => {
    if (!p.releaseCode) return;
    const list = p1ByCode.get(p.releaseCode) ?? [];
    list.push(p);
    p1ByCode.set(p.releaseCode, list);
  });

  return releases.map((release) => {
    const issues = p1ByCode.get(release.releaseCode) ?? [];
    const blockers = getDbBlockers(release, issues);
    return {
      key: readinessKey("database", release.id),
      id: release.id,
      source: "database" as const,
      readiness: calcDbReadiness(release, issues),
      blockerCount: blockers.length,
    };
  });
}

export function buildDemoReadinessSummaries(): ReleaseReadinessSummary[] {
  return demoReleases.map((release) => ({
    key: readinessKey("demo", release.id),
    id: release.id,
    source: "demo" as const,
    readiness: calcReadiness(release),
    blockerCount: getBlockers(release).length,
  }));
}

export async function buildAllReadinessSummaries(
  prisma: typeof import("./prisma").prisma
): Promise<ReleaseReadinessSummary[]> {
  const [db, demo] = await Promise.all([
    buildDbReadinessSummaries(prisma),
    Promise.resolve(buildDemoReadinessSummaries()),
  ]);
  return [...db, ...demo];
}
