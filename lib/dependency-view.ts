import fs from "fs";
import path from "path";

type SeedRow = Record<string, unknown>;

export type DependencyViewRow = {
  id: string;
  depCode: string;
  releaseCode: string;
  releaseName: string;
  releaseDbId: string | null;
  dependsOnCode: string;
  dependsOnName: string;
  dependsOnDbId: string | null;
  dependencyType: string;
  status: string;
  impactIfBlocked: string;
  notes: string | null;
};

let cached: SeedRow[] | null = null;

export function loadSeedDependencies(): SeedRow[] {
  if (cached) return cached;
  const file = path.join(process.cwd(), "prisma/seed-data/dependencies.json");
  cached = JSON.parse(fs.readFileSync(file, "utf-8"));
  return cached!;
}

export function mapSeedDependencyRow(
  row: SeedRow,
  releaseIdByCode: Map<string, string>
): DependencyViewRow {
  const depCode = String(row["Dep ID"]);
  const releaseCode = String(row["Release ID"]);
  const dependsOnCode = String(row["Depends On Release"]);
  return {
    id: depCode,
    depCode,
    releaseCode,
    releaseName: String(row["Release Name"] ?? ""),
    releaseDbId: releaseIdByCode.get(releaseCode) ?? null,
    dependsOnCode,
    dependsOnName: String(row["Depends On Name"] ?? ""),
    dependsOnDbId: releaseIdByCode.get(dependsOnCode) ?? null,
    dependencyType: String(row["Dependency Type"] ?? ""),
    status: String(row["Status"] ?? ""),
    impactIfBlocked: String(row["Impact if Blocked"] ?? ""),
    notes: row["Notes"] ? String(row["Notes"]) : null,
  };
}

export function filterSeedDependencies(
  rows: DependencyViewRow[],
  filters: { status?: string; dependencyType?: string; impact?: string }
): DependencyViewRow[] {
  return rows.filter((row) => {
    if (filters.status && row.status !== filters.status) return false;
    if (filters.dependencyType && row.dependencyType !== filters.dependencyType) return false;
    if (filters.impact && row.impactIfBlocked !== filters.impact) return false;
    return true;
  });
}
