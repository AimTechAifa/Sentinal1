import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/api";
import { analyseMappingRisks } from "@/lib/system-mapping-risk";
import { prisma } from "@/lib/prisma";

const edgeInclude = {
  sourceApp: true,
  sourceEnv: true,
  targetApp: true,
  targetEnv: true,
  group: { select: { id: true, name: true } },
} as const;

export async function GET(req: Request) {
  const { error } = await requireRole("readonly");
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const edges = await prisma.systemMappingEdge.findMany({ include: edgeInclude });

  if (!from || !to) {
    return NextResponse.json({ edges, risks: [] });
  }

  const fromDate = new Date(from);
  const toDate = new Date(to);

  const bookings = await prisma.envBooking.findMany({
    where: { status: "BOOKED" },
    include: { application: true, environment: true },
  });

  const risks = analyseMappingRisks(edges, bookings, fromDate, toDate);

  return NextResponse.json({ edges, risks, period: { from, to } });
}

export async function POST(req: Request) {
  const { error } = await requireRole("editor");
  if (error) return error;
  const body = await req.json();
  const row = await prisma.systemMappingEdge.create({
    data: {
      sourceAppId: body.sourceAppId,
      sourceEnvId: body.sourceEnvId,
      targetAppId: body.targetAppId,
      targetEnvId: body.targetEnvId,
      direction: body.direction ?? "downstream",
      notes: body.notes,
      isDefault: body.isDefault ?? true,
    },
    include: {
      sourceApp: true,
      sourceEnv: true,
      targetApp: true,
      targetEnv: true,
    },
  });
  return NextResponse.json(row, { status: 201 });
}
