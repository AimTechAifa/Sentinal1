/**
 * Next.js instrumentation — runs once when the Node server starts.
 * Wakes Neon so the first user request doesn't hit a cold-start P1001.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "edge") return;

  try {
    const { ensureDbAwake } = await import("@/lib/prisma");
    const ok = await ensureDbAwake();
    if (ok) console.log("[instrumentation] Neon database awake");
    else console.warn("[instrumentation] Neon wake failed — first requests may retry");
  } catch (err) {
    console.warn("[instrumentation] db wake skipped:", err);
  }
}
