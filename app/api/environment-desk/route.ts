import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/api";
import { buildBookings, buildTimeline, buildVersionMatrix } from "@/lib/db-environment-desk";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { error } = await requireRole("readonly");
  if (error) return error;

  const [apps, versions, releases, bookings, edges, environments] = await Promise.all([
    prisma.application.findMany({ include: { department: true, environments: true } }),
    prisma.environmentVersion.findMany({ include: { environment: true, application: { include: { department: true } } } }),
    prisma.release.findMany({ include: { department: true }, orderBy: { releaseDate: "asc" } }),
    prisma.envBooking.findMany({ include: { application: true }, orderBy: { fromDate: "asc" } }),
    prisma.systemMappingEdge.findMany({
      include: { sourceApp: true, sourceEnv: true, targetApp: true, targetEnv: true },
    }),
    prisma.environment.findMany({ include: { application: true } }),
  ]);

  const versionMatrix = buildVersionMatrix(apps, versions, releases);
  const timeline = buildTimeline(releases);
  const bookingRows = buildBookings(bookings);
  const driftCount = versionMatrix.filter((v) => v.drift).length;

  return NextResponse.json({
    versionMatrix,
    versions,
    timeline,
    bookings: bookingRows,
    edges,
    environments,
    applications: apps,
    stats: {
      activeReleases: releases.filter((r) => r.status === "In Progress" || r.status === "At Risk").length,
      bookedEnvs: bookings.length,
      driftApps: driftCount,
      mappingEdges: edges.length,
    },
    alerts: [
      ...(driftCount > 0
        ? [{
            id: "drift",
            severity: "medium" as const,
            title: `${driftCount} application(s) with promotion drift`,
            detail: "DEV/TEST versions differ from PROD — review promotion matrix.",
            href: "/environments",
            actionLabel: "View matrix",
          }]
        : []),
      ...(releases.some((r) => r.status === "At Risk")
        ? [{
            id: "at-risk",
            severity: "high" as const,
            title: "Release at risk",
            detail: "One or more releases flagged At Risk in the current train.",
            href: "/releases",
            actionLabel: "View releases",
          }]
        : []),
    ],
  });
}
