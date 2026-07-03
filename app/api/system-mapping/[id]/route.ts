import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/api";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error } = await requireRole("editor");
  if (error) return error;
  const body = await req.json();
  const row = await prisma.systemMappingEdge.update({
    where: { id: id },
    data: {
      notes: body.notes,
      direction: body.direction,
      isDefault: body.isDefault,
    },
    include: {
      sourceApp: true,
      sourceEnv: true,
      targetApp: true,
      targetEnv: true,
    },
  });
  return NextResponse.json(row);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error } = await requireRole("editor");
  if (error) return error;
  await prisma.systemMappingEdge.delete({ where: { id: id } });
  return NextResponse.json({ ok: true });
}
