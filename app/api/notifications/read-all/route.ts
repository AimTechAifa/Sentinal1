import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/api";
import { markAllNotificationsRead } from "@/lib/release-state-repo";

export async function POST() {
  const { error } = await requireRole("readonly");
  if (error) return error;

  await markAllNotificationsRead();
  return NextResponse.json({ ok: true });
}
