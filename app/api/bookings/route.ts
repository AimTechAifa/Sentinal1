import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/api";
import { checkBookingAvailability } from "@/lib/booking";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { user, error } = await requireRole("readonly");
  if (error) return error;

  const body = await req.json();
  const applicationIds: string[] = body.applicationIds ?? [];
  const fromDate = new Date(body.fromDate);
  const toDate = new Date(body.toDate);

  if (!applicationIds.length || Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
    return NextResponse.json({ error: "applicationIds, fromDate, and toDate are required" }, { status: 400 });
  }

  const result = await checkBookingAvailability(applicationIds, fromDate, toDate);
  return NextResponse.json({ ...result, checkedBy: user!.email });
}

export async function PUT(req: Request) {
  const { user, error } = await requireRole("editor");
  if (error) return error;

  const body = await req.json();
  const applicationIds: string[] = body.applicationIds ?? [];
  const fromDate = new Date(body.fromDate);
  const toDate = new Date(body.toDate);

  const check = await checkBookingAvailability(applicationIds, fromDate, toDate);
  if (!check.available) {
    return NextResponse.json({ error: "Not available", conflicts: check.conflicts }, { status: 409 });
  }

  const apps = await prisma.application.findMany({
    where: { id: { in: applicationIds } },
    include: { department: true, environments: true },
  });

  const created = await Promise.all(
    apps.map((app) =>
      prisma.envBooking.create({
        data: {
          applicationId: app.id,
          environmentId: app.environments[0]?.id,
          bookedBy: user!.name,
          team: app.department.name,
          departmentName: app.department.name,
          fromDate,
          toDate,
          purpose: body.purpose ?? "End-to-end test window",
          releaseId: body.releaseId,
          status: "BOOKED",
        },
        include: { application: true, environment: true },
      })
    )
  );

  return NextResponse.json({ bookings: created }, { status: 201 });
}

export async function GET() {
  const { error } = await requireRole("readonly");
  if (error) return error;
  const data = await prisma.envBooking.findMany({
    include: { application: true, environment: true, release: true },
    orderBy: { fromDate: "asc" },
  });
  return NextResponse.json(data);
}
