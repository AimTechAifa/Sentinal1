import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/api";
import { releases } from "@/lib/dummy-data";
import { recordReminderSent } from "@/lib/release-state-repo";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { user, error } = await requireRole("editor");
  if (error) return error;

  const release = releases.find((r) => r.id === id);
  if (!release) return NextResponse.json({ error: "Release not found" }, { status: 404 });

  const body = (await req.json()) as { version?: string; gate: string; channel: string };

  await recordReminderSent(
    id,
    body.version ?? release.version,
    body.gate,
    body.channel,
    user!.name
  );

  return NextResponse.json({ ok: true });
}
