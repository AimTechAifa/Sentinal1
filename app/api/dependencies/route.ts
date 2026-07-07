import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/api";
import {
  filterSeedDependencies,
  loadSeedDependencies,
  mapSeedDependencyRow,
} from "@/lib/dependency-view";
import { prisma } from "@/lib/prisma";
import { sp } from "@/lib/list-api-filters";

export async function GET(req: Request) {
  const { error } = await requireRole("readonly");
  if (error) return error;

  const params = sp(req);
  const status = params.get("status") ?? undefined;
  const dependencyType = params.get("type") ?? undefined;
  const impact = params.get("impact") ?? undefined;

  const releases = await prisma.release.findMany({
    select: { id: true, releaseCode: true },
  });
  const releaseIdByCode = new Map(releases.map((r) => [r.releaseCode, r.id]));

  const rows = loadSeedDependencies()
    .map((row) => mapSeedDependencyRow(row, releaseIdByCode))
    .sort((a, b) => a.depCode.localeCompare(b.depCode, undefined, { numeric: true }));

  const filtered = filterSeedDependencies(rows, { status, dependencyType, impact });
  return NextResponse.json(filtered);
}
