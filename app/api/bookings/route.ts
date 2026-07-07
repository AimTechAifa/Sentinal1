import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/api";
import { checkBookingAvailability } from "@/lib/booking";
import {
  filterSeedEnvBookings,
  loadSeedEnvBookings,
  mapSeedEnvBookingRow,
} from "@/lib/env-booking-view";
import { prisma } from "@/lib/prisma";
import { sp } from "@/lib/list-api-filters";
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

export async function GET(req: Request) {
  const { error } = await requireRole("readonly");
  if (error) return error;

  const params = sp(req);
  const deptId = params.get("dept");
  const appId = params.get("app");
  const releaseParam = params.get("release");
  const conflict = params.get("conflict");

  const [deptRec, appRec, releaseRec] = await Promise.all([
    deptId ? prisma.department.findUnique({ where: { id: deptId }, select: { name: true } }) : null,
    appId ? prisma.application.findUnique({ where: { id: appId }, select: { name: true } }) : null,
    releaseParam
      ? prisma.release.findFirst({
          where: { OR: [{ id: releaseParam }, { releaseCode: releaseParam }] },
          select: { releaseCode: true },
        })
      : null,
  ]);

  const seedRows = loadSeedEnvBookings().map(mapSeedEnvBookingRow);
  const filtered = filterSeedEnvBookings(seedRows, {
    departmentName: deptRec?.name,
    applicationName: appRec?.name,
    releaseId: releaseRec?.releaseCode ?? (releaseParam?.startsWith("REL-") ? releaseParam : undefined),
    conflictFlag: conflict === "1" ? true : conflict === "0" ? false : undefined,
  });

  filtered.sort((a, b) => a.bookingCode.localeCompare(b.bookingCode, undefined, { numeric: true }));
  return NextResponse.json(filtered);
}
