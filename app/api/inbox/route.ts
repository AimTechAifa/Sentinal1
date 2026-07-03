import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/api";
import { parseReleaseFilters } from "@/lib/db-release-filter";
import { buildInboxItemsCached } from "@/lib/inbox";
import { prisma } from "@/lib/prisma";
import type { Period } from "@/lib/unified-releases";

export async function GET(req: Request) {
  const { user, error } = await requireRole("readonly");
  if (error) return error;

  const url = new URL(req.url);
  const period = (url.searchParams.get("period") ?? "year") as Period;
  const filters = parseReleaseFilters(req);

  const payload = await buildInboxItemsCached({
    period,
    filters,
    sessionName: user?.name ?? "",
    prisma,
  });

  return NextResponse.json(payload);
}
