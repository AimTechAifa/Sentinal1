import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/api";
import { prisma } from "@/lib/prisma";

function preferencesDelegate() {
  return (prisma as { userTablePreference?: typeof prisma.userTablePreference }).userTablePreference;
}

async function readPrefs(clerkUserId: string, pageKey: string) {
  const delegate = preferencesDelegate();
  if (!delegate) return { hiddenColumns: [] as string[], hiddenFilters: [] as string[] };

  try {
    const rows = await prisma.$queryRaw<{ hiddenColumns: string[]; hiddenFilters: string[] }[]>`
      SELECT "hiddenColumns", COALESCE("hiddenFilters", ARRAY[]::text[]) AS "hiddenFilters"
      FROM "UserTablePreference"
      WHERE "clerkUserId" = ${clerkUserId} AND "pageKey" = ${pageKey}
      LIMIT 1
    `;
    const row = rows[0];
    return {
      hiddenColumns: row?.hiddenColumns ?? [],
      hiddenFilters: row?.hiddenFilters ?? [],
    };
  } catch {
    const pref = await delegate.findUnique({
      where: { clerkUserId_pageKey: { clerkUserId, pageKey } },
      select: { hiddenColumns: true },
    });
    return { hiddenColumns: pref?.hiddenColumns ?? [], hiddenFilters: [] };
  }
}

export async function GET(request: NextRequest) {
  const { user, error } = await requireSession();
  if (error) return error;

  const pageKey = request.nextUrl.searchParams.get("pageKey");
  if (!pageKey) {
    return NextResponse.json({ error: "pageKey is required" }, { status: 400 });
  }

  try {
    const prefs = await readPrefs(user!.id, pageKey);
    return NextResponse.json(prefs);
  } catch (err) {
    console.error("table-preferences GET failed:", err);
    return NextResponse.json({ hiddenColumns: [], hiddenFilters: [] });
  }
}

export async function PUT(request: NextRequest) {
  const { user, error } = await requireSession();
  if (error) return error;

  let body: { pageKey?: string; hiddenColumns?: string[]; hiddenFilters?: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { pageKey, hiddenColumns, hiddenFilters } = body;
  if (!pageKey || typeof pageKey !== "string") {
    return NextResponse.json({ error: "pageKey is required" }, { status: 400 });
  }
  if (hiddenColumns !== undefined && (!Array.isArray(hiddenColumns) || !hiddenColumns.every((c) => typeof c === "string"))) {
    return NextResponse.json({ error: "hiddenColumns must be a string array" }, { status: 400 });
  }
  if (hiddenFilters !== undefined && (!Array.isArray(hiddenFilters) || !hiddenFilters.every((c) => typeof c === "string"))) {
    return NextResponse.json({ error: "hiddenFilters must be a string array" }, { status: 400 });
  }

  const delegate = preferencesDelegate();
  if (!delegate) {
    return NextResponse.json({ error: "Table preferences unavailable — restart the dev server after prisma generate" }, { status: 503 });
  }

  try {
    const existing = await readPrefs(user!.id, pageKey);
    const nextHiddenColumns = hiddenColumns ?? existing.hiddenColumns;
    const nextHiddenFilters = hiddenFilters ?? existing.hiddenFilters;

    await prisma.$executeRaw`
      INSERT INTO "UserTablePreference" ("id", "clerkUserId", "pageKey", "hiddenColumns", "hiddenFilters", "createdAt", "updatedAt")
      VALUES (gen_random_uuid()::text, ${user!.id}, ${pageKey}, ${nextHiddenColumns}, ${nextHiddenFilters}, NOW(), NOW())
      ON CONFLICT ("clerkUserId", "pageKey")
      DO UPDATE SET
        "hiddenColumns" = ${nextHiddenColumns},
        "hiddenFilters" = ${nextHiddenFilters},
        "updatedAt" = NOW()
    `;

    return NextResponse.json({
      hiddenColumns: nextHiddenColumns,
      hiddenFilters: nextHiddenFilters,
    });
  } catch (err) {
    console.error("table-preferences PUT failed:", err);

    // Fallback when hiddenFilters column is not migrated yet
    if (hiddenColumns !== undefined) {
      try {
        const pref = await delegate.upsert({
          where: { clerkUserId_pageKey: { clerkUserId: user!.id, pageKey } },
          create: { clerkUserId: user!.id, pageKey, hiddenColumns },
          update: { hiddenColumns },
          select: { hiddenColumns: true },
        });
        return NextResponse.json({ hiddenColumns: pref.hiddenColumns, hiddenFilters: [] });
      } catch (fallbackErr) {
        console.error("table-preferences PUT fallback failed:", fallbackErr);
      }
    }

    return NextResponse.json({ error: "Failed to save table preferences" }, { status: 500 });
  }
}
