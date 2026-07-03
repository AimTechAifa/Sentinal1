import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/api";
import { markNotificationRead } from "@/lib/release-state-repo";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error } = await requireRole("readonly");
  if (error) return error;

  await markNotificationRead(id);
  return NextResponse.json({ ok: true });
}
