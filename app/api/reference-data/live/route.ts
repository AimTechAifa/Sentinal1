import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/api";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { error } = await requireRole("readonly");
  if (error) return error;

  const [
    counts,
    departments,
    applications,
    environments,
    users,
    environmentVersions,
  ] = await Promise.all([
    Promise.all([
      prisma.department.count(),
      prisma.application.count(),
      prisma.environment.count(),
      prisma.user.count(),
      prisma.release.count(),
      prisma.calendarEvent.count(),
      prisma.envBooking.count(),
      prisma.risk.count(),
      prisma.drift.count(),
      prisma.releaseDependency.count(),
      prisma.approval.count(),
      prisma.leaveRecord.count(),
      prisma.environmentVersion.count(),
    ]).then(([department, application, environment, user, release, calendarEvent, envBooking, risk, drift, releaseDependency, approval, leaveRecord, environmentVersion]) => ({
      department,
      application,
      environment,
      user,
      release,
      calendarEvent,
      envBooking,
      risk,
      drift,
      releaseDependency,
      approval,
      leaveRecord,
      environmentVersion,
    })),
    prisma.department.findMany({ orderBy: { name: "asc" } }),
    prisma.application.findMany({
      include: { department: true, environments: { orderBy: { name: "asc" } } },
      orderBy: [{ department: { name: "asc" } }, { name: "asc" }],
    }),
    prisma.environment.findMany({
      include: { application: { include: { department: true } } },
      orderBy: [{ application: { name: "asc" } }, { name: "asc" }],
    }),
    prisma.user.findMany({ orderBy: [{ department: "asc" }, { name: "asc" }] }),
    prisma.environmentVersion.findMany({
      include: {
        application: { include: { department: true } },
        environment: true,
      },
      orderBy: [{ application: { name: "asc" } }, { environment: { name: "asc" } }],
    }),
  ]);

  return NextResponse.json({
    counts,
    departments,
    applications,
    environments,
    users,
    environmentVersions,
  });
}
