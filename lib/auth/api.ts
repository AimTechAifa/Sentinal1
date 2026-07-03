import { NextResponse } from "next/server";
import { getSession } from "./session";
import { canAdmin, canEdit } from "./roles";

export async function requireSession() {
  const user = await getSession();
  if (!user) {
    return { user: null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { user, error: null };
}

export async function requireRole(minRole: "readonly" | "editor" | "admin") {
  const { user, error } = await requireSession();
  if (error) return { user: null, error };

  if (minRole === "admin" && !canAdmin(user)) {
    return { user, error: NextResponse.json({ error: "Admin access required" }, { status: 403 }) };
  }
  if (minRole === "editor" && !canEdit(user)) {
    return { user, error: NextResponse.json({ error: "Editor access required" }, { status: 403 }) };
  }
  return { user, error: null };
}
