import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/api";
import { prisma } from "@/lib/prisma";
import { testConnectorById } from "@/lib/connectorEngineClient";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireRole("editor");
  if (error) return error;

  const { id } = await params;
  const connector = await prisma.connector.findUnique({ where: { id } });
  if (!connector) {
    return NextResponse.json({ error: "Connector not found" }, { status: 404 });
  }

  try {
    const result = await testConnectorById(id);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Connector engine unavailable";
    return NextResponse.json({ ok: false, message }, { status: 502 });
  }
}
