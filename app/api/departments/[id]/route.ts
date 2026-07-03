import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/api";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error } = await requireRole("editor");
  if (error) return error;
  const body = await req.json();
  const row = await prisma.department.update({
    where: { id: id },
    data: { name: body.name, head: body.head },
  });
  return NextResponse.json(row);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error } = await requireRole("editor");
  if (error) return error;

  const appCount = await prisma.application.count({ where: { departmentId: id } });
  if (appCount > 0) {
    return NextResponse.json(
      { error: `Cannot delete — ${appCount} application${appCount === 1 ? "" : "s"} use this department` },
      { status: 409 }
    );
  }

  await prisma.department.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
