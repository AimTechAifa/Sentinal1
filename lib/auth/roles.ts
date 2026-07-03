export type UserRole = "readonly" | "editor" | "admin";

export interface SessionUser {
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

export function canEdit(user: SessionUser | null): boolean {
  return user?.role === "editor" || user?.role === "admin";
}

export function canAdmin(user: SessionUser | null): boolean {
  return user?.role === "admin";
}
