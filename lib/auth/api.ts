import { NextResponse } from "next/server";
import { getSession } from "./session";

export async function requireSession() {
  const user = await getSession();
  if (!user) {
    return { user: null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { user, error: null };
}

/** Demo pass: any Clerk session passes; minRole kept for call-site compatibility. */
export async function requireRole(_minRole: "readonly" | "editor" | "admin") {
  return requireSession();
}
