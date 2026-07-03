import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/api";
import { applyQuickStartSeed } from "@/lib/release-state-repo";
import type { QuickStartSeedId } from "@/lib/release-store";

const VALID_SEEDS: QuickStartSeedId[] = [
  "reset",
  "go-v2141",
  "green-path-v2141",
  "deploy-mid-v2140",
  "deploy-incident-v2140",
  "deploy-verified-v2141",
];

export async function POST(_req: Request, { params }: { params: Promise<{ seedId: string }> }) {
  const { seedId } = await params;
  const { user, error } = await requireRole("editor");
  if (error) return error;

  if (!VALID_SEEDS.includes(seedId as QuickStartSeedId)) {
    return NextResponse.json({ error: "Unknown seed" }, { status: 400 });
  }

  await applyQuickStartSeed(seedId as QuickStartSeedId, user!.name);
  return NextResponse.json({ ok: true });
}
