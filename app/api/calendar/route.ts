import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/api";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { error } = await requireRole("readonly");
  if (error) return error;

  const data = await prisma.calendarEvent.findMany({
    include: {
      release: {
        select: {
          releaseCode: true,
          status: true,
        },
      },
    },
    orderBy: { date: "asc" },
  });

  return NextResponse.json(data);
}
