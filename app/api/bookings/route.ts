import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/api";
import { checkBookingAvailability } from "@/lib/booking";
import { prisma } from "@/lib/prisma";
import { bookingWhere, mapDbEnvBookingRow, sp } from "@/lib/list-api-filters";

/** Availability check only (readonly+). */
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

/** Create booking(s) — editor/admin. Reuses checkBookingAvailability for conflicts. */
export async function PUT(req: Request) {
  const { user, error } = await requireRole("editor");
  if (error) return error;

  const body = await req.json();
  const applicationIds: string[] = body.applicationIds ?? [];
  const fromDate = new Date(body.fromDate);
  const toDate = new Date(body.toDate);
  const environmentId: string | undefined = body.environmentId || undefined;
  const releaseId: string | undefined = body.releaseId || undefined;
  const purpose: string | undefined = body.purpose || undefined;
  const teamOverride: string | undefined = body.team || undefined;

  if (!applicationIds.length || Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
    return NextResponse.json({ error: "applicationIds, fromDate, and toDate are required" }, { status: 400 });
  }
  if (toDate < fromDate) {
    return NextResponse.json({ error: "toDate must be on or after fromDate" }, { status: 400 });
  }

  const check = await checkBookingAvailability(applicationIds, fromDate, toDate);
  if (!check.available) {
    return NextResponse.json({ error: "Not available", conflicts: check.conflicts }, { status: 409 });
  }

  const apps = await prisma.application.findMany({
    where: { id: { in: applicationIds } },
    include: { department: true, environments: true },
  });

  if (!apps.length) {
    return NextResponse.json({ error: "No matching applications" }, { status: 400 });
  }

  const existingCodes = await prisma.envBooking.findMany({
    where: { bookingCode: { not: null } },
    select: { bookingCode: true },
  });
  let nextNum =
    existingCodes
      .map((r) => Number(String(r.bookingCode ?? "").replace(/^ENV-/i, "")))
      .filter((n) => Number.isFinite(n))
      .reduce((max, n) => Math.max(max, n), 0) + 1;

  const dayMs = 24 * 60 * 60 * 1000;
  const spanDays = Math.max(1, Math.round((toDate.getTime() - fromDate.getTime()) / dayMs) + 1);

  const created = await Promise.all(
    apps.map(async (app) => {
      const env =
        (environmentId
          ? app.environments.find((e) => e.id === environmentId)
          : undefined) ?? app.environments[0];
      const bookingCode = `ENV-${String(nextNum++).padStart(4, "0")}`;
      const team = teamOverride?.trim() || app.department.name;

      return prisma.envBooking.create({
        data: {
          bookingCode,
          applicationId: app.id,
          environmentId: env?.id,
          bookedBy: user!.name,
          team,
          departmentName: app.department.name,
          fromDate,
          toDate,
          purpose: purpose ?? "End-to-end test window",
          releaseId: releaseId || null,
          status: "BOOKED",
          conflictFlag: false,
          testEnvCode: env?.name ?? null,
          testStart: fromDate,
          testEnd: toDate,
          testDays: spanDays,
        },
        include: {
          application: { include: { department: true } },
          release: { select: { id: true, releaseCode: true } },
        },
      });
    }),
  );

  return NextResponse.json({ bookings: created.map(mapDbEnvBookingRow) }, { status: 201 });
}

export async function GET(req: Request) {
  const { error } = await requireRole("readonly");
  if (error) return error;

  const params = sp(req);
  const rows = await prisma.envBooking.findMany({
    where: bookingWhere(params),
    include: {
      application: { include: { department: true } },
      release: { select: { id: true, releaseCode: true } },
    },
    orderBy: { bookingCode: "asc" },
  });

  return NextResponse.json(rows.map(mapDbEnvBookingRow));
}
