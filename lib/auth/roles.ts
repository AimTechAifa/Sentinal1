export type UserRole = "readonly" | "editor" | "admin";

export interface SessionUser {
  /** Stable Clerk user id — use for per-user preferences (filters, columns, etc.) */
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export const SESSION_COOKIE = "sentinel-session";

export const ROLE_LABELS: Record<UserRole, string> = {
  readonly: "Read only",
  editor: "Editor",
  admin: "Admin",
};

/** Demo pass: any authenticated user has full access. Real tiers deferred. */
export function canEdit(user: SessionUser | null): boolean {
  return user != null;
}

/** Demo pass: any authenticated user has full access. Real tiers deferred. */
export function canAdmin(user: SessionUser | null): boolean {
  return user != null;
}
