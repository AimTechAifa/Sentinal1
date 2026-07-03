import { getRedis } from "@/lib/redis";

/** Default 60s — balances freshness with free-tier command budget (~1 GET per repeat load). */
export const DEFAULT_CACHE_TTL_SECONDS = 60;

export function cacheKey(prefix: string, parts: Record<string, string | undefined>): string {
  const segment = Object.entries(parts)
    .filter(([, value]) => value != null && value !== "")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  return `sentinel:${prefix}:${segment || "default"}`;
}

/**
 * Cache-aside helper. On Redis miss or error, runs `loader` and stores the result.
 * Failures never block the request — the app falls back to Postgres.
 */
export async function cachedJson<T>(
  key: string,
  ttlSeconds: number,
  loader: () => Promise<T>
): Promise<T> {
  const redis = getRedis();

  if (redis) {
    try {
      const hit = await redis.get<T>(key);
      if (hit != null) return hit;
    } catch (err) {
      console.warn("[cache] redis get failed:", err);
    }
  }

  const fresh = await loader();

  if (redis) {
    try {
      await redis.set(key, fresh, { ex: ttlSeconds });
    } catch (err) {
      console.warn("[cache] redis set failed:", err);
    }
  }

  return fresh;
}
