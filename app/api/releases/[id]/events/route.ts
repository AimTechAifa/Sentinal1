import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/api";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error } = await requireRole("readonly");
  if (error) return error;
  const events = await prisma.releaseAuditEvent.findMany({
    where: { releaseId: id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return NextResponse.json(events);
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, error } = await requireRole("editor");
  if (error) return error;

  const body = await req.json();
  const event = await prisma.releaseAuditEvent.create({
    data: {
      releaseId: id,
      action: body.action ?? "note",
      actor: user!.name,
      detail: body.detail,
    },
  });

  if (body.action === "decision") {
    const decision = body.detail?.startsWith("Go") ? "Go" : body.detail?.startsWith("No") ? "No-Go" : body.detail;
    if (decision) {
      await prisma.release.update({ where: { id: id }, data: { decision } });
    }
  }

  return NextResponse.json(event, { status: 201 });
}
