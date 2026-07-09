import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/** Neon cold-start / pooler blip codes that are safe to retry. */
const RETRYABLE_CODES = new Set([
  "P1001", // Can't reach database server
  "P1002", // Database server timed out
  "P1008", // Operations timed out
  "P1017", // Server closed the connection
]);

function isRetryableDbError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as { code?: string; message?: string; name?: string };
  if (e.code && RETRYABLE_CODES.has(e.code)) return true;
  if (e.name === "PrismaClientInitializationError") return true;
  const msg = (e.message ?? "").toLowerCase();
  return (
    msg.includes("can't reach database server") ||
    msg.includes("timed out") ||
    msg.includes("connection reset") ||
    msg.includes("server closed the connection") ||
    msg.includes("connection terminated")
  );
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Run a Prisma operation with retries for Neon cold-starts / transient pooler failures.
 * Default: 4 attempts, exponential backoff starting at 500ms.
 */
export async function withDbRetry<T>(
  op: () => Promise<T>,
  opts?: { attempts?: number; baseDelayMs?: number; label?: string }
): Promise<T> {
  const attempts = opts?.attempts ?? 4;
  const baseDelayMs = opts?.baseDelayMs ?? 500;
  let lastErr: unknown;

  for (let i = 0; i < attempts; i++) {
    try {
      return await op();
    } catch (err) {
      lastErr = err;
      if (!isRetryableDbError(err) || i === attempts - 1) throw err;
      const delay = baseDelayMs * 2 ** i;
      const label = opts?.label ? ` (${opts.label})` : "";
      console.warn(
        `[db] retry ${i + 1}/${attempts - 1} after ${delay}ms${label}:`,
        err instanceof Error ? err.message.slice(0, 160) : err
      );
      // Drop dead connections so the next attempt opens a fresh one after Neon wakes.
      try {
        await prisma.$disconnect();
      } catch {
        /* ignore */
      }
      await sleep(delay);
    }
  }

  throw lastErr;
}

/** Best-effort wake ping — used on server boot / before heavy lookup routes. */
export async function ensureDbAwake(): Promise<boolean> {
  try {
    await withDbRetry(() => prisma.$queryRawUnsafe("SELECT 1"), {
      attempts: 5,
      baseDelayMs: 800,
      label: "wake",
    });
    return true;
  } catch (err) {
    console.warn(
      "[db] wake failed:",
      err instanceof Error ? err.message.slice(0, 200) : err
    );
    return false;
  }
}
