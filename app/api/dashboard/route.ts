import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/api";
import { prisma } from "@/lib/prisma";
import { getRiskLevel, type RiskLevel } from "@/lib/risk-level";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Command Dashboard — every field below is a live aggregate query against
 * Postgres, computed fresh on each request (no hardcoded/mock numbers).
 * Built incrementally, section by section; see inline comments for the
 * exact query logic backing each number.
 */
export async function GET() {
  const { error } = await requireRole("readonly");
  if (error) return error;

  const now = new Date();

  // --- 1. Hero: "Needs attention now" ---
  const [blockedReleases, activeP1Incidents, appsDownProd] = await Promise.all([
    prisma.release.count({ where: { status: "Blocked" } }),
    prisma.incident.count({ where: { severity: "P1", status: { notIn: ["Resolved"] } } }),
    prisma.applicationStatus.count({ where: { status: "Down", environmentName: "Prod" } }),
  ]);

  // --- 2. Release Pipeline (Total + 5 most-actionable statuses) ---
  // Real Release.status values in this dataset: Draft, Planning, Testing,
  // Pending CAB, Approved, Blocked. "Draft" is excluded from tiles — it's
  // the pre-actionable bucket (not yet ready for the pipeline), everything
  // else here is something a release manager needs to move forward.
  const [totalReleases, releaseStatusCounts] = await Promise.all([
    prisma.release.count(),
    prisma.release.groupBy({ by: ["status"], _count: true }),
  ]);
  const countByStatus = (status: string) =>
    releaseStatusCounts.find((r) => r.status === status)?._count ?? 0;

  const pipeline = [
    { label: "Total Releases", value: totalReleases, href: "/releases", tone: "indigo" as const },
    { label: "Blocked", value: countByStatus("Blocked"), href: "/releases?status=Blocked", tone: "rose" as const },
    { label: "Pending CAB", value: countByStatus("Pending CAB"), href: "/releases?status=Pending+CAB", tone: "violet" as const },
    { label: "In Testing", value: countByStatus("Testing"), href: "/releases?status=Testing", tone: "sky" as const },
    { label: "Approved", value: countByStatus("Approved"), href: "/releases?status=Approved", tone: "emerald" as const },
    { label: "Planning", value: countByStatus("Planning"), href: "/releases?status=Planning", tone: "amber" as const },
  ];

  // --- 3. Operations & Environments (6 tiles) ---
  const [
    incidentSeverityCounts,
    criticalAlertsActive,
    totalAlertsActive,
    envConflictBookings,
    totalBookings,
    blockedDeps,
    totalDeps,
    pendingApprovals,
    nextCab,
    staffOnLeaveNext7,
  ] = await Promise.all([
    prisma.incident.groupBy({ by: ["severity"], where: { status: { notIn: ["Resolved"] } }, _count: true }),
    prisma.monitoringAlert.count({ where: { severity: "Critical", status: "Active" } }),
    prisma.monitoringAlert.count({ where: { status: "Active" } }),
    prisma.envBooking.count({ where: { conflictFlag: true } }),
    prisma.envBooking.count(),
    prisma.releaseDependency.count({ where: { status: "Blocked" } }),
    prisma.releaseDependency.count(),
    prisma.approval.count({ where: { decision: "Pending" } }),
    prisma.release.findFirst({
      where: { cabDate: { gte: now } },
      orderBy: { cabDate: "asc" },
      select: { cabDate: true },
    }),
    prisma.leaveRecord.count({
      where: { leaveStart: { lte: new Date(now.getTime() + 7 * DAY_MS) }, leaveEnd: { gte: now } },
    }),
  ]);
  const activeIncidentsTotal = incidentSeverityCounts.reduce((sum, r) => sum + r._count, 0);
  const p1Active = incidentSeverityCounts.find((r) => r.severity === "P1")?._count ?? 0;
  const p2Active = incidentSeverityCounts.find((r) => r.severity === "P2")?._count ?? 0;
  const p3Active = incidentSeverityCounts.find((r) => r.severity === "P3")?._count ?? 0;
  const daysToNextCab = nextCab?.cabDate
    ? Math.round((nextCab.cabDate.getTime() - now.getTime()) / DAY_MS)
    : null;

  const ops = [
    {
      label: "Active Incidents",
      value: activeIncidentsTotal,
      sub: `${p1Active} P1 · ${p2Active} P2 · ${p3Active} P3`,
      href: "/incidents",
      tone: "rose" as const,
    },
    {
      label: "Critical Alerts",
      value: criticalAlertsActive,
      sub: `${totalAlertsActive} active total`,
      href: "/monitoring-alerts?severity=Critical&status=Active",
      tone: "amber" as const,
    },
    {
      label: "Env Conflicts",
      value: envConflictBookings,
      sub: `${totalBookings} bookings`,
      href: "/conflicts",
      tone: "violet" as const,
    },
    {
      label: "Blocked Deps",
      value: blockedDeps,
      sub: `of ${totalDeps} total`,
      href: "/dependencies?status=Blocked",
      tone: "sky" as const,
    },
    {
      label: "Pending Approvals",
      value: pendingApprovals,
      sub: daysToNextCab !== null ? `CAB in ${daysToNextCab} day${daysToNextCab === 1 ? "" : "s"}` : "No CAB scheduled",
      href: "/approvals",
      tone: "indigo" as const,
    },
    {
      label: "Staff on Leave",
      value: staffOnLeaveNext7,
      sub: "next 7 days",
      href: "/leaves",
      tone: "emerald" as const,
    },
  ];

  // --- 4. Application Availability donut ---
  const [appStatusCounts, appStatusProd] = await Promise.all([
    prisma.applicationStatus.groupBy({ by: ["status"], _count: true }),
    prisma.applicationStatus.groupBy({ by: ["status"], where: { environmentName: "Prod" }, _count: true }),
  ]);
  const healthyCount = appStatusCounts.find((r) => r.status === "Healthy")?._count ?? 0;
  const degradedCount = appStatusCounts.find((r) => r.status === "Degraded")?._count ?? 0;
  const downCount = appStatusCounts.find((r) => r.status === "Down")?._count ?? 0;
  const totalAppStatus = healthyCount + degradedCount + downCount;
  const prodHealthy = appStatusProd.find((r) => r.status === "Healthy")?._count ?? 0;
  const prodTotal = appStatusProd.reduce((sum, r) => sum + r._count, 0);

  const availability = {
    counts: [
      { name: "Healthy", value: healthyCount, color: "#10b981" },
      { name: "Degraded", value: degradedCount, color: "#f59e0b" },
      { name: "Down", value: downCount, color: "#f43f5e" },
    ],
    percentHealthy: totalAppStatus > 0 ? Math.round((healthyCount / totalAppStatus) * 100) : 0,
    prod: { healthy: prodHealthy, total: prodTotal },
    total: totalAppStatus,
  };

  // --- 5. Incident Trend — daily count, last 7 days ---
  // Anchored to the latest Incident.timestamp in the dataset (not real
  // wall-clock "now"): this is a fixed historical seed snapshot, so "last 7
  // days" means the most recent 7 days of actual recorded incident
  // activity, not an empty window past the end of the data.
  const latestIncident = await prisma.incident.findFirst({ orderBy: { timestamp: "desc" }, select: { timestamp: true } });
  const trendAnchor = latestIncident?.timestamp ?? now;
  const trendStart = new Date(trendAnchor.getTime() - 6 * DAY_MS);
  trendStart.setUTCHours(0, 0, 0, 0);
  const incidentsInWindow = await prisma.incident.findMany({
    where: { timestamp: { gte: trendStart } },
    select: { timestamp: true },
  });
  const incidentTrend: { date: string; count: number }[] = [];
  for (let i = 0; i < 7; i++) {
    const dayStart = new Date(trendStart.getTime() + i * DAY_MS);
    const dayEnd = new Date(dayStart.getTime() + DAY_MS);
    const count = incidentsInWindow.filter((r) => r.timestamp >= dayStart && r.timestamp < dayEnd).length;
    incidentTrend.push({ date: dayStart.toISOString().slice(0, 10), count });
  }

  // --- 6. Risk Distribution — Risk.riskScore bucketed by corrected Simple
  // Risk Score bands (1-5/6-11/12-19/20-25, lib/risk-level.ts) ---
  const risks = await prisma.risk.findMany({ select: { riskScore: true } });
  const riskBandCounts: Record<RiskLevel, number> = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
  for (const r of risks) riskBandCounts[getRiskLevel(r.riskScore)]++;
  const riskDistribution = [
    { name: "Low", value: riskBandCounts.LOW, color: "#10b981" },
    { name: "Medium", value: riskBandCounts.MEDIUM, color: "#f59e0b" },
    { name: "High", value: riskBandCounts.HIGH, color: "#fb923c" },
    { name: "Critical", value: riskBandCounts.CRITICAL, color: "#f43f5e" },
  ];

  // --- 7. Release Trend — releases scheduled per week, next 4 weeks (real wall-clock now) ---
  const in4Weeks = new Date(now.getTime() + 28 * DAY_MS);
  const upcomingReleases = await prisma.release.findMany({
    where: { releaseDate: { gte: now, lte: in4Weeks } },
    select: { releaseDate: true },
  });
  const releaseTrend: { week: string; count: number }[] = [];
  for (let w = 0; w < 4; w++) {
    const weekStart = new Date(now.getTime() + w * 7 * DAY_MS);
    const weekEnd = new Date(weekStart.getTime() + 7 * DAY_MS);
    const count = upcomingReleases.filter((r) => r.releaseDate >= weekStart && r.releaseDate < weekEnd).length;
    releaseTrend.push({ week: `W${w + 1}`, count });
  }

  // --- 8. Planned Maintenance list ---
  const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const todayEnd = new Date(todayStart.getTime() + DAY_MS);
  const in30Days = new Date(now.getTime() + 30 * DAY_MS);
  const [scheduledToday, dbRefresh30, vendor30, fullOutage30] = await Promise.all([
    prisma.plannedMaintenance.count({ where: { scheduledDate: { gte: todayStart, lt: todayEnd } } }),
    prisma.plannedMaintenance.count({ where: { type: "DB Refresh", scheduledDate: { gte: now, lte: in30Days } } }),
    prisma.plannedMaintenance.count({ where: { type: "Vendor Maintenance", scheduledDate: { gte: now, lte: in30Days } } }),
    prisma.plannedMaintenance.count({ where: { impact: "Full Outage", scheduledDate: { gte: now, lte: in30Days } } }),
  ]);
  const maintenance = [
    { label: "Scheduled today", value: scheduledToday, href: "/planned-maintenance" },
    { label: "DB refreshes (30d)", value: dbRefresh30, href: "/planned-maintenance?type=DB+Refresh" },
    { label: "Vendor windows (30d)", value: vendor30, href: "/planned-maintenance?type=Vendor+Maintenance" },
    { label: "Full outages (30d)", value: fullOutage30, href: "/planned-maintenance" },
  ];

  // --- 9. Overall Health — recomputed from real thresholds, not hardcoded ---
  const health = [
    { label: "Release Pipeline", status: blockedReleases > 0 ? "Critical" : "Healthy" },
    { label: "Environment Health", status: envConflictBookings > 0 ? "Critical" : "Healthy" },
    { label: "Incident Status", status: activeP1Incidents > 0 ? "Critical" : activeIncidentsTotal > 0 ? "Warning" : "Healthy" },
    { label: "Alert Status", status: criticalAlertsActive > 0 ? "Critical" : totalAlertsActive > 0 ? "Warning" : "Healthy" },
  ];

  return NextResponse.json({
    generatedAt: now.toISOString(),
    hero: { blockedReleases, activeP1Incidents, appsDownProd },
    pipeline,
    ops,
    availability,
    incidentTrend,
    riskDistribution,
    releaseTrend,
    maintenance,
    health,
  });
}
