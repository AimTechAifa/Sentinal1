import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/api";
import { resetDemoState } from "@/lib/release-state-repo";

export async function POST() {
  const { error } = await requireRole("editor");
  if (error) return error;

  await resetDemoState();
  return NextResponse.json({ ok: true });
}
