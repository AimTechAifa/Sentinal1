import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/api";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { error } = await requireRole("readonly");
  if (error) return error;

  const [releases, bookings] = await Promise.all([
    prisma.release.findMany({
      where: { conflictFlag: true },
      include: {
        department: { select: { name: true } },
        applications: { include: { application: { select: { name: true } } } },
        bookings: true,
      },
      orderBy: { releaseDate: "asc" },
    }),
    prisma.envBooking.findMany({
      where: { conflictFlag: true },
      include: {
        application: { select: { id: true, name: true } },
        environment: { select: { id: true, name: true } },
        release: { select: { id: true, releaseCode: true, name: true } },
      },
      orderBy: { fromDate: "asc" },
    }),
  ]);

  return NextResponse.json({ releases, bookings });
}
