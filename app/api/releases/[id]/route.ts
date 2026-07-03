import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/api";
import { prisma } from "@/lib/prisma";
import { normalizeProgramProject } from "@/lib/release-id";

const releaseInclude = {
  department: true,
  releaseOwner: { select: { userId: true, name: true, email: true, role: true } },
  stakeholders: { include: { user: { select: { userId: true, name: true, email: true, role: true } } } },
  applications: { include: { application: { include: { department: true } } } },
  dependsOn: { include: { dependsOnRelease: true } },
  dependedBy: { include: { release: true } },
  bookings: { include: { application: true, environment: true } },
  auditEvents: { orderBy: { createdAt: "desc" as const }, take: 50 },
};

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error } = await requireRole("readonly");
  if (error) return error;

  // Accept both UUID primary key and releaseCode (e.g. REL-0002)
  const row = await prisma.release.findFirst({
    where: { OR: [{ id }, { releaseCode: id }] },
    include: releaseInclude,
  });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(row);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, error } = await requireRole("editor");
  if (error) return error;

  const body = await req.json();
  // Resolve actual record — accept UUID or releaseCode
  const existing = await prisma.release.findFirst({ where: { OR: [{ id }, { releaseCode: id }] } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const realId = existing.id;

  const data: Record<string, unknown> = {};
  for (const key of ["name", "owner", "status", "priority", "impact", "notes", "decision", "departmentId", "releaseCode"]) {
    if (body[key] !== undefined) data[key] = body[key];
  }
  if (body.programProject !== undefined) {
    data.programProject = normalizeProgramProject(body.programProject) ?? "N/A";
  }
  if (body.releaseDate) data.releaseDate = new Date(body.releaseDate);

  await prisma.release.update({ where: { id: realId }, data });

  if (body.applicationIds) {
    await prisma.releaseApplication.deleteMany({ where: { releaseId: realId } });
    if (body.applicationIds.length) {
      await prisma.releaseApplication.createMany({
        data: body.applicationIds.map((applicationId: string) => ({ releaseId: realId, applicationId })),
      });
    }
  }

  if (body.dependsOnReleaseIds) {
    await prisma.releaseDependency.deleteMany({ where: { releaseId: realId } });
    if (body.dependsOnReleaseIds.length) {
      await prisma.releaseDependency.createMany({
        data: body.dependsOnReleaseIds.map((dependsOnReleaseId: string) => ({
          releaseId: realId,
          dependsOnReleaseId,
        })),
      });
    }
  }

  if (body.status && body.status !== existing.status) {
    await prisma.releaseAuditEvent.create({
      data: {
        releaseId: realId,
        action: "status_change",
        actor: user!.name,
        detail: `Status changed to ${body.status}`,
      },
    });
  }

  const updated = await prisma.release.findUnique({ where: { id: realId }, include: releaseInclude });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error } = await requireRole("editor");
  if (error) return error;
  await prisma.release.delete({ where: { id: (await prisma.release.findFirst({ where: { OR: [{ id }, { releaseCode: id }] } }))?.id ?? id } });
  return NextResponse.json({ ok: true });
}
