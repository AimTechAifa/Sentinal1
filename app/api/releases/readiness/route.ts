import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/api";
import { buildAllReadinessSummaries } from "@/lib/release-readiness-batch";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { error } = await requireRole("readonly");
  if (error) return error;

  const items = await buildAllReadinessSummaries(prisma);
  const byKey = Object.fromEntries(items.map((i) => [i.key, i]));

  return NextResponse.json({ items, byKey });
}
