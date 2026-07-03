import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/api";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error } = await requireRole("editor");
  if (error) return error;

  const body = await req.json();
  const likelihood = body.likelihood !== undefined ? Number(body.likelihood) : undefined;
  const impact = body.impact !== undefined ? Number(body.impact) : undefined;

  let riskScore: number | undefined;
  if (likelihood !== undefined || impact !== undefined) {
    const existing = await prisma.risk.findUnique({ where: { id }, select: { likelihood: true, impact: true } });
    if (!existing) return NextResponse.json({ error: "Risk not found" }, { status: 404 });
    const finalLikelihood = likelihood ?? existing.likelihood;
    const finalImpact = impact ?? existing.impact;
    // Always server-computed — never trust a client-supplied riskScore.
    riskScore = finalLikelihood * finalImpact;
  }

  const row = await prisma.risk.update({
    where: { id },
    data: {
      category: body.category,
      description: body.description,
      likelihood,
      impact,
      riskScore,
      affectedArea: body.affectedArea,
      mitigationStrategy: body.mitigationStrategy,
      riskOwnerId: body.riskOwnerId,
      status: body.status,
      notes: body.notes,
    },
    include: {
      release: { select: { id: true, releaseCode: true, name: true } },
      riskOwner: { select: { id: true, userId: true, name: true } },
    },
  });
  return NextResponse.json(row);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error } = await requireRole("editor");
  if (error) return error;

  await prisma.risk.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
