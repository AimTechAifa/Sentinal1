import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/api";
import { prisma } from "@/lib/prisma";

/** Read-only for this pass — seeded monitoring data, no create/edit UI yet. */
export async function GET() {
  const { error } = await requireRole("readonly");
  if (error) return error;

  const data = await prisma.monitoringAlert.findMany({
    include: { application: { select: { id: true, name: true } } },
    orderBy: { timestamp: "desc" },
  });
  return NextResponse.json(data);
}
