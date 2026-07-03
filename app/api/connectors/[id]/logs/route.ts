import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/api";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireRole("readonly");
  if (error) return error;

  const { id } = await params;
  const connector = await prisma.connector.findUnique({ where: { id }, select: { id: true } });
  if (!connector) {
    return NextResponse.json({ error: "Connector not found" }, { status: 404 });
  }

  const logs = await prisma.connectorSyncLog.findMany({
    where: { connectorId: id },
    orderBy: { startedAt: "desc" },
    take: 50,
  });

  return NextResponse.json(logs);
}
