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

/** All conflict IDs involving each release, regardless of which side it appears on. */
export function conflictCodesByRelease(): Map<string, string[]> {
  const byRelease = new Map<string, string[]>();

  for (const row of loadSeedConflicts()) {
    const conflictCode = String(row["Conflict ID"] ?? "").trim();
    if (!conflictCode) continue;

    for (const field of ["Release 1", "Release 2"] as const) {
      const releaseCode = String(row[field] ?? "").trim();
      if (!releaseCode) continue;
      const codes = byRelease.get(releaseCode) ?? [];
      if (!codes.includes(conflictCode)) codes.push(conflictCode);
      byRelease.set(releaseCode, codes);
    }
  }

  for (const codes of byRelease.values()) {
    codes.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }
  return byRelease;
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

function contains(hay: string | null | undefined, needle: string | undefined) {
  if (!needle) return true;
  return (hay ?? "").toLowerCase().includes(needle.trim().toLowerCase());
}

export type ConflictSeedFilters = {
  departmentName?: string;
  applicationName?: string;
  status?: string;
  priority?: string;
  assignedToQ?: string;
  conflictCodeQ?: string;
  release1CodeQ?: string;
  release2CodeQ?: string;
  conflictingEnvironmentQ?: string;
  environmentConflictType?: string;
  notesQ?: string;
};

export function filterSeedConflicts(
  rows: ConflictViewRow[],
  filters: ConflictSeedFilters
): ConflictViewRow[] {
  return rows.filter((row) => {
    if (filters.status && row.status !== filters.status) return false;
    if (filters.priority && row.priority !== filters.priority) return false;
    if (filters.departmentName && !row.department.includes(filters.departmentName)) return false;
    if (filters.applicationName && !row.application.includes(filters.applicationName)) return false;
    if (!contains(row.assignedTo, filters.assignedToQ)) return false;
    if (!contains(row.conflictCode, filters.conflictCodeQ)) return false;
    if (!contains(row.release1Code, filters.release1CodeQ)) return false;
    if (!contains(row.release2Code, filters.release2CodeQ)) return false;
    if (!contains(row.conflictingEnvironment, filters.conflictingEnvironmentQ)) return false;
    if (
      filters.environmentConflictType &&
      row.environmentConflictType !== filters.environmentConflictType
    ) {
      return false;
    }
    if (!contains(row.notes, filters.notesQ)) return false;
    return true;
  });
}
