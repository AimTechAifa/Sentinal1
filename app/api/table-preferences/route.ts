import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/api";
import { prisma } from "@/lib/prisma";

function preferencesDelegate() {
  return (prisma as { userTablePreference?: typeof prisma.userTablePreference }).userTablePreference;
}

export async function GET(request: NextRequest) {
  const { user, error } = await requireSession();
  if (error) return error;

  const pageKey = request.nextUrl.searchParams.get("pageKey");
  if (!pageKey) {
    return NextResponse.json({ error: "pageKey is required" }, { status: 400 });
  }

  const delegate = preferencesDelegate();
  if (!delegate) {
    return NextResponse.json({ hiddenColumns: [] });
  }

  try {
    const pref = await delegate.findUnique({
      where: {
        clerkUserId_pageKey: {
          clerkUserId: user!.id,
          pageKey,
        },
      },
      select: { hiddenColumns: true },
    });
    return NextResponse.json({ hiddenColumns: pref?.hiddenColumns ?? [] });
  } catch (err) {
    console.error("table-preferences GET failed:", err);
    return NextResponse.json({ hiddenColumns: [] });
  }
}

export async function PUT(request: NextRequest) {
  const { user, error } = await requireSession();
  if (error) return error;

  let body: { pageKey?: string; hiddenColumns?: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { pageKey, hiddenColumns } = body;
  if (!pageKey || typeof pageKey !== "string") {
    return NextResponse.json({ error: "pageKey is required" }, { status: 400 });
  }
  if (!Array.isArray(hiddenColumns) || !hiddenColumns.every((c) => typeof c === "string")) {
    return NextResponse.json({ error: "hiddenColumns must be a string array" }, { status: 400 });
  }

  const delegate = preferencesDelegate();
  if (!delegate) {
    return NextResponse.json({ error: "Column preferences unavailable — restart the dev server after prisma generate" }, { status: 503 });
  }

  try {
    const pref = await delegate.upsert({
      where: {
        clerkUserId_pageKey: {
          clerkUserId: user!.id,
          pageKey,
        },
      },
      create: {
        clerkUserId: user!.id,
        pageKey,
        hiddenColumns,
      },
      update: {
        hiddenColumns,
      },
      select: { hiddenColumns: true },
    });
    return NextResponse.json({ hiddenColumns: pref.hiddenColumns });
  } catch (err) {
    console.error("table-preferences PUT failed:", err);
    return NextResponse.json({ error: "Failed to save column preferences" }, { status: 500 });
  }
}
