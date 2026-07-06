import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/api";
import { prisma } from "@/lib/prisma";

/**
 * Read-only for this pass. CURRENT STATE data — one row per
 * (application, environment), overwritten on each check, not a history log.
 */
export async function GET() {
  const { error } = await requireRole("readonly");
  if (error) return error;

  const data = await prisma.applicationStatus.findMany({
    include: { application: { select: { id: true, name: true } } },
    orderBy: [{ application: { name: "asc" } }, { environmentName: "asc" }],
  });
  return NextResponse.json(data);
}
