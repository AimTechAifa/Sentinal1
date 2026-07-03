import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/api";
import { releases } from "@/lib/dummy-data";
import { startDeployment } from "@/lib/release-state-repo";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, error } = await requireRole("editor");
  if (error) return error;

  const release = releases.find((r) => r.id === id);
  if (!release) return NextResponse.json({ error: "Release not found" }, { status: 404 });

  await startDeployment(release, user!.name);
  return NextResponse.json({ ok: true });
}
