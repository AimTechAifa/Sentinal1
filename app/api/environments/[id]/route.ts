import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/api";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error } = await requireRole("editor");
  if (error) return error;
  const body = await req.json();
  const row = await prisma.environment.update({
    where: { id: id },
    data: {
      applicationId: body.applicationId,
      name: body.name,
      type: body.type,
      owner: body.owner,
      lastDbRefresh: body.lastDbRefresh ? new Date(body.lastDbRefresh) : null,
      status: body.status,
    },
    include: { application: true },
  });
  return NextResponse.json(row);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error } = await requireRole("editor");
  if (error) return error;

  const [versionCount, bookingCount] = await Promise.all([
    prisma.environmentVersion.count({ where: { environmentId: id } }),
    prisma.envBooking.count({ where: { environmentId: id } }),
  ]);
  if (versionCount > 0) {
    return NextResponse.json(
      { error: `Cannot delete — ${versionCount} version record${versionCount === 1 ? "" : "s"} linked to this environment` },
      { status: 409 }
    );
  }
  if (bookingCount > 0) {
    return NextResponse.json(
      { error: `Cannot delete — used by ${bookingCount} env booking${bookingCount === 1 ? "" : "s"}` },
      { status: 409 }
    );
  }

  await prisma.environment.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
