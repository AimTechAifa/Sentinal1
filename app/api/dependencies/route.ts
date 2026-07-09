import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/api";
import {
  filterSeedDependencies,
  loadSeedDependencies,
  mapSeedDependencyRow,
} from "@/lib/dependency-view";
import { prisma } from "@/lib/prisma";
import { sp, str } from "@/lib/list-api-filters";

export async function GET(req: Request) {
  const { error } = await requireRole("readonly");
  if (error) return error;

  const params = sp(req);

  const releases = await prisma.release.findMany({
    select: { id: true, releaseCode: true },
  });
  const releaseIdByCode = new Map(releases.map((r) => [r.releaseCode, r.id]));

  const rows = loadSeedDependencies()
    .map((row) => mapSeedDependencyRow(row, releaseIdByCode))
    .sort((a, b) => a.depCode.localeCompare(b.depCode, undefined, { numeric: true }));

  const filtered = filterSeedDependencies(rows, {
    status: str(params, "status"),
    dependencyType: str(params, "type"),
    impact: str(params, "impact"),
    releaseCodeQ: str(params, "release"),
    dependsOnCodeQ: str(params, "dependsOn"),
    depCodeQ: str(params, "depCode"),
    releaseNameQ: str(params, "releaseName"),
    dependsOnNameQ: str(params, "dependsOnName"),
    notesQ: str(params, "notes"),
  });
  return NextResponse.json(filtered);
}
