import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/api";
import { getLiveState } from "@/lib/release-state-repo";
import { emptyReleaseStore } from "@/lib/release-store";

/**
 * Live release-store snapshot for the client poller.
 * Never 500 on transient Neon disconnects — return empty/stale store instead
 * so the UI keeps retrying without crashing the session.
 */
export async function GET() {
  const { error } = await requireRole("readonly");
  if (error) return error;

  try {
    const state = await getLiveState();
    return NextResponse.json(state);
  } catch (err) {
    console.warn("[api/live-state] falling back to empty store:", err);
    return NextResponse.json(emptyReleaseStore());
  }
}
