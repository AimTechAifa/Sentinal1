import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/api";
import {
  filterDemoReleasesForPeriod,
  parseReleaseFilters,
  prismaReleaseWhere,
} from "@/lib/db-release-filter";
import {
  buildDbAttentionItem,
  buildDemoAttentionItem,
  isNeedsAttentionStatus,
  sortAttentionItems,
} from "@/lib/needs-attention";
import { getLiveState } from "@/lib/release-state-repo";
import { prisma } from "@/lib/prisma";
import { periodRange, type Period } from "@/lib/unified-releases";
import type { ReleaseDecision } from "@/lib/types";

export async function GET(req: Request) {
  const { error } = await requireRole("readonly");
  if (error) return error;

  const url = new URL(req.url);
  const period = (url.searchParams.get("period") ?? "month") as Period;
  const filters = parseReleaseFilters(req);
  const { start, end } = periodRange(period);

  const [departments, applications, environments, dbRows, liveState] = await Promise.all([
    prisma.department.findMany(),
    prisma.application.findMany(),
    prisma.environment.findMany({ include: { application: true } }),
    prisma.release.findMany({
      where: prismaReleaseWhere(filters, {
        releaseDate: { gte: start, lte: end },
        status: { in: ["Blocked", "At Risk"] },
      }),
      include: {
        department: true,
        auditEvents: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { releaseDate: "asc" },
    }),
    getLiveState(),
  ]);

  const dbItems = dbRows.map(buildDbAttentionItem);

  const demoFiltered = filterDemoReleasesForPeriod(
    period,
    filters,
    departments,
    applications,
    environments
  );

  const demoItems = demoFiltered
    .filter((r) => isNeedsAttentionStatus(r.status))
    .map((release) => {
      const decision =
        (liveState.decisions[release.id]?.decision as ReleaseDecision | undefined) ??
        release.decision ??
        null;
      const deployPhase = liveState.deployments[release.id]?.phase ?? "Not Started";
      return buildDemoAttentionItem(release, decision, deployPhase);
    });

  const items = sortAttentionItems([...dbItems, ...demoItems]);

  return NextResponse.json({
    period,
    range: { start, end },
    count: items.length,
    items,
  });
}
