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

export async function POST(req: Request) {
  const { error } = await requireRole("readonly");
  if (error) return error;

  const body = (await req.json()) as { from?: string; to?: string };
  if (!body.from || !body.to) {
    return NextResponse.json({ error: "from and to dates required" }, { status: 400 });
  }

  const fromDate = new Date(body.from);
  const toDate = new Date(body.to);
  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
    return NextResponse.json({ error: "invalid date range" }, { status: 400 });
  }

  const edges = await prisma.systemMappingEdge.findMany({ include: edgeInclude });
  const bookings = await prisma.envBooking.findMany({
    where: { status: "BOOKED" },
    include: { application: true, environment: true },
  });

  const risks = analyseMappingRisks(edges, bookings, fromDate, toDate);

  return NextResponse.json({
    risks,
    period: { from: body.from, to: body.to },
    edgeCount: edges.length,
  });
}
