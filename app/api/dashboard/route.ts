import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/api";
import { prismaReleaseWhere, parseReleaseFilters } from "@/lib/db-release-filter";
import { toLegacyConnectorSummary } from "@/lib/connectors/public";
import { prisma } from "@/lib/prisma";
import { countByStatus } from "@/lib/unified-releases";
import { periodRange, type Period } from "@/lib/period-range";
import { cacheKey, cachedJson, DEFAULT_CACHE_TTL_SECONDS } from "@/lib/cache";

export async function GET(req: Request) {
  const { error } = await requireRole("readonly");
  if (error) return error;

  const url = new URL(req.url);
  const period = (url.searchParams.get("period") ?? "year") as Period;
  const filters = parseReleaseFilters(req);

  const key = cacheKey("dashboard", {
    period,
    dept: filters.departmentId,
    app: filters.applicationId,
    env: filters.environmentId,
  });

  const payload = await cachedJson(key, DEFAULT_CACHE_TTL_SECONDS, async () => {
    const { start, end } = periodRange(period);

    const where = prismaReleaseWhere(filters, {
      releaseDate: { gte: start, lte: end },
    });

    const releases = await prisma.release.findMany({ where });
    const counts = countByStatus(releases);

    const p1Where: { priority: string; application?: string } = { priority: "P1" };
    if (filters.applicationId) {
      const app = await prisma.application.findUnique({ where: { id: filters.applicationId } });
      if (app) p1Where.application = app.name;
    }

    const [connectorRows, p1Issues] = await Promise.all([
      prisma.connector.findMany({
        where: { enabled: true },
        orderBy: { name: "asc" },
        select: { name: true, lastSyncedAt: true },
      }),
      prisma.p1Issue.findMany({ where: p1Where, orderBy: { updatedAt: "desc" } }),
    ]);
    const connectors = toLegacyConnectorSummary(connectorRows);

    return {
      period,
      counts,
      connectors,
      p1Issues,
      range: { start: start.toISOString(), end: end.toISOString() },
    };
  });

  return NextResponse.json(payload);
}
