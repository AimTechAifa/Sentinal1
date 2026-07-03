const syncNowTimestamps = new Map<string, number>();
const SYNC_NOW_COOLDOWN_MS = 60_000;

export function checkSyncNowRateLimit(connectorId: string): { allowed: boolean; retryAfterSec?: number } {
  const now = Date.now();
  const last = syncNowTimestamps.get(connectorId) ?? 0;
  const elapsed = now - last;
  if (elapsed < SYNC_NOW_COOLDOWN_MS) {
    return {
      allowed: false,
      retryAfterSec: Math.ceil((SYNC_NOW_COOLDOWN_MS - elapsed) / 1000),
    };
  }
  syncNowTimestamps.set(connectorId, now);
  return { allowed: true };
}
