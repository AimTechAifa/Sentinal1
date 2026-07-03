import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/api";
import { releases } from "@/lib/dummy-data";
import { recordDecision } from "@/lib/release-state-repo";
import type { ReleaseDecision } from "@/lib/types";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { user, error } = await requireRole("editor");
  if (error) return error;

  const release = releases.find((r) => r.id === id);
  if (!release) return NextResponse.json({ error: "Release not found" }, { status: 404 });

  const body = (await req.json()) as {
    decision: ReleaseDecision;
    version?: string;
    rationale?: string;
    overridden?: boolean;
  };

  await recordDecision(id, body.version ?? release.version, body.decision, {
    rationale: body.rationale,
    overridden: body.overridden,
    actor: user!.name,
  });

  return NextResponse.json({ ok: true });
}
