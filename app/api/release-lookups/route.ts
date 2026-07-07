import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/api";
import {
  filterSeedEnvBookings,
  loadSeedEnvBookings,
  mapSeedEnvBookingRow,
} from "@/lib/env-booking-view";
import {
  applicationOrderBy,
  applicationWhere,
  calendarEventWhere,
  departmentOrderBy,
  departmentWhere,
  releaseListOrderBy,
  releaseListWhere,
  sp,
} from "@/lib/list-api-filters";
import { prisma } from "@/lib/prisma";

/** One request, sequential DB queries — avoids Neon pool exhaustion from 6 parallel API routes. */
export async function GET(req: Request) {
  const { error } = await requireRole("readonly");
  if (error) return error;

  try {
    const params = sp(req);

    const departments = await prisma.department.findMany({
      where: departmentWhere(params),
      orderBy: departmentOrderBy(params),
      select: { id: true, name: true },
    });

    const applications = await prisma.application.findMany({
      where: applicationWhere(params),
      orderBy: applicationOrderBy(params),
      select: { id: true, name: true, departmentId: true },
    });

    const environments = await prisma.environment.findMany({
      include: { application: { select: { id: true, name: true } } },
      orderBy: { name: "asc" },
    });

    const deptId = params.get("dept");
    const appId = params.get("app");
    const releaseParam = params.get("release");
    const conflict = params.get("conflict");

    const deptRec = deptId
      ? await prisma.department.findUnique({ where: { id: deptId }, select: { name: true } })
      : null;
    const appRec = appId
      ? await prisma.application.findUnique({ where: { id: appId }, select: { name: true } })
      : null;
    const releaseRec = releaseParam
      ? await prisma.release.findFirst({
          where: { OR: [{ id: releaseParam }, { releaseCode: releaseParam }] },
          select: { releaseCode: true },
        })
      : null;

    const seedRows = loadSeedEnvBookings().map(mapSeedEnvBookingRow);
    const bookings = filterSeedEnvBookings(seedRows, {
      departmentName: deptRec?.name,
      applicationName: appRec?.name,
      releaseId: releaseRec?.releaseCode ?? (releaseParam?.startsWith("REL-") ? releaseParam : undefined),
      conflictFlag: conflict === "1" ? true : conflict === "0" ? false : undefined,
    }).sort((a, b) => a.bookingCode.localeCompare(b.bookingCode, undefined, { numeric: true }));

    const releases = await prisma.release.findMany({
      where: releaseListWhere(params),
      include: {
        department: true,
        applications: { include: { application: true } },
        dependsOn: { include: { dependsOnRelease: true } },
        stakeholders: { include: { user: true } },
      },
      orderBy: releaseListOrderBy(params),
    });

    const calendarEvents = await prisma.calendarEvent.findMany({
      where: calendarEventWhere(params),
      include: {
        release: { select: { releaseCode: true, status: true } },
      },
      orderBy: { date: "asc" },
    });

    return NextResponse.json({
      departments,
      applications,
      environments,
      bookings,
      releases,
      calendarEvents,
    });
  } catch (err) {
    console.error("release-lookups failed:", err);
    return NextResponse.json({ error: "Failed to load release lookups" }, { status: 500 });
  }
}
