import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/api";
import { prisma } from "@/lib/prisma";
import { releaseListOrderBy, releaseListWhere, sp } from "@/lib/list-api-filters";
import { generateReleaseId, normalizeProgramProject } from "@/lib/release-id";

export async function GET(req: Request) {
  const { error } = await requireRole("readonly");
  if (error) return error;
  const params = sp(req);
  const data = await prisma.release.findMany({
    where: releaseListWhere(params),
    include: {
      department: true,
      applications: { include: { application: true } },
      dependsOn: { include: { dependsOnRelease: true } },
      stakeholders: { include: { user: true } },
    },
    orderBy: releaseListOrderBy(params),
  });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const { error } = await requireRole("editor");
  if (error) return error;
  const body = await req.json();

  const existing = await prisma.release.findMany({ select: { releaseCode: true } });
  const releaseCode =
    body.releaseCode?.trim() ||
    generateReleaseId(existing.map((r) => r.releaseCode));

  const row = await prisma.release.create({
    data: {
      releaseCode,
      name: body.name,
      programProject: normalizeProgramProject(body.programProject ?? "") ?? "N/A",
      owner: body.owner,
      status: body.status ?? "Planned",
      releaseDate: new Date(body.releaseDate),
      priority: body.priority ?? "Medium",
      impact: body.impact ?? "Medium",
      departmentId: body.departmentId,
      notes: body.notes ?? null,
      applications: body.applicationIds?.length
        ? { create: body.applicationIds.map((id: string) => ({ applicationId: id })) }
        : undefined,
      dependsOn: body.dependsOnReleaseIds?.length
        ? { create: body.dependsOnReleaseIds.map((dependsOnReleaseId: string) => ({ dependsOnReleaseId })) }
        : undefined,
    },
    include: { department: true, applications: { include: { application: true } }, dependsOn: { include: { dependsOnRelease: true } }, stakeholders: { include: { user: true } } },
  });
  return NextResponse.json(row, { status: 201 });
}
