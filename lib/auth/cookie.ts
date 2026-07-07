import type { SessionUser } from "./roles";

export function parseSession(raw: string | undefined): SessionUser | null {
  if (!raw) return null;
  try {
    const json = Buffer.from(raw, "base64url").toString("utf8");
    const user = JSON.parse(json) as Partial<SessionUser>;
    if (!user.email || !user.role) return null;
    return {
      id: user.id ?? user.email,
      email: user.email,
      name: user.name ?? user.email,
      role: user.role,
    };
  } catch {
    return null;
  }
}

export function encodeSession(user: SessionUser): string {
  return Buffer.from(JSON.stringify(user), "utf8").toString("base64url");
}
