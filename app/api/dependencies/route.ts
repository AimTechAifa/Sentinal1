import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/api";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { error } = await requireRole("readonly");
  if (error) return error;

  const data = await prisma.releaseDependency.findMany({
    include: {
      release: { select: { id: true, releaseCode: true, name: true, status: true, releaseDate: true } },
      dependsOnRelease: { select: { id: true, releaseCode: true, name: true, status: true, releaseDate: true } },
    },
    orderBy: { releaseId: "asc" },
  });
  return NextResponse.json(data);
}
