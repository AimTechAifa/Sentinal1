import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/api";
import { getLiveState } from "@/lib/release-state-repo";

export async function GET() {
  const { error } = await requireRole("readonly");
  if (error) return error;

  const state = await getLiveState();
  return NextResponse.json(state);
}
