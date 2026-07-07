import fs from "fs";
import path from "path";

type SeedRow = Record<string, unknown>;

export type ConflictViewRow = {
  id: string;
  conflictCode: string;
  status: string;
  priority: string;
  assignedTo: string;
  release1Code: string;
  release2Code: string;
  release1DbId: string | null;
  release2DbId: string | null;
  application: string;
  department: string;
  conflictingEnvironment: string;
  environmentConflictType: string;
  notes: string | null;
};

let cached: SeedRow[] | null = null;

export function loadSeedConflicts(): SeedRow[] {
  if (cached) return cached;
  const file = path.join(process.cwd(), "prisma/seed-data/conflicts.json");
  cached = JSON.parse(fs.readFileSync(file, "utf-8"));
  return cached!;
}

export function mapSeedConflictRow(
  row: SeedRow,
  releaseIdByCode: Map<string, string>
): ConflictViewRow {
  const conflictCode = String(row["Conflict ID"]);
  const release1Code = String(row["Release 1"]);
  const release2Code = String(row["Release 2"]);
  return {
    id: conflictCode,
    conflictCode,
    status: String(row["Status"] ?? ""),
    priority: String(row["Priority"] ?? ""),
    assignedTo: String(row["Assigned To"] ?? ""),
    release1Code,
    release2Code,
    release1DbId: releaseIdByCode.get(release1Code) ?? null,
    release2DbId: releaseIdByCode.get(release2Code) ?? null,
    application: String(row["Application"] ?? ""),
    department: String(row["Department"] ?? ""),
    conflictingEnvironment: String(row["Conflicting Environment"] ?? ""),
    environmentConflictType: String(row["Environment Conflict Type"] ?? ""),
    notes: row["Notes"] ? String(row["Notes"]) : null,
  };
}

export function filterSeedConflicts(
  rows: ConflictViewRow[],
  filters: {
    departmentName?: string;
    applicationName?: string;
    status?: string;
    priority?: string;
  }
): ConflictViewRow[] {
  return rows.filter((row) => {
    if (filters.status && row.status !== filters.status) return false;
    if (filters.priority && row.priority !== filters.priority) return false;
    if (filters.departmentName && !row.department.includes(filters.departmentName)) return false;
    if (filters.applicationName && !row.application.includes(filters.applicationName)) return false;
    return true;
  });
}
