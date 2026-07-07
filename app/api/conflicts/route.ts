import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/api";
import {
  filterSeedConflicts,
  loadSeedConflicts,
  mapSeedConflictRow,
} from "@/lib/conflict-view";
import { prisma } from "@/lib/prisma";
import { sp } from "@/lib/list-api-filters";

export async function GET(req: Request) {
  const { error } = await requireRole("readonly");
  if (error) return error;

  const params = sp(req);
  const deptId = params.get("dept");
  const appId = params.get("app");
  const status = params.get("status") ?? undefined;
  const priority = params.get("priority") ?? undefined;

  const [deptRec, appRec, releases] = await Promise.all([
    deptId ? prisma.department.findUnique({ where: { id: deptId }, select: { name: true } }) : null,
    appId ? prisma.application.findUnique({ where: { id: appId }, select: { name: true } }) : null,
    prisma.release.findMany({ select: { id: true, releaseCode: true } }),
  ]);

  const releaseIdByCode = new Map(releases.map((r) => [r.releaseCode, r.id]));

  const rows = loadSeedConflicts()
    .map((row) => mapSeedConflictRow(row, releaseIdByCode))
    .sort((a, b) => a.conflictCode.localeCompare(b.conflictCode, undefined, { numeric: true }));

  const conflicts = filterSeedConflicts(rows, {
    departmentName: deptRec?.name,
    applicationName: appRec?.name,
    status,
    priority,
  });

  return NextResponse.json(conflicts);
}
