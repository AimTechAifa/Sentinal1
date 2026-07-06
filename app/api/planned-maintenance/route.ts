import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/api";
import { prisma } from "@/lib/prisma";

/** Read-only for this pass — seeded maintenance calendar data. */
export async function GET() {
  const { error } = await requireRole("readonly");
  if (error) return error;

  const data = await prisma.plannedMaintenance.findMany({
    include: { application: { select: { id: true, name: true } } },
    orderBy: { scheduledDate: "asc" },
  });
  return NextResponse.json(data);
}
