import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/api";
import { prisma } from "@/lib/prisma";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireRole("editor");
  if (error) return error;

  const { id } = await params;
  if (id === "legacy-default") {
    await prisma.systemMappingEdge.deleteMany({ where: { groupId: null } });
    return NextResponse.json({ ok: true });
  }

  await prisma.systemMappingGroup.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
