import { NextResponse } from "next/server";
import { resolveSessionName } from "@/lib/user-match";
import { encodeSession } from "@/lib/auth/cookie";
import { SESSION_COOKIE, type SessionUser, type UserRole } from "@/lib/auth/roles";

export async function POST(req: Request) {
  const body = (await req.json()) as { email?: string; name?: string; role?: UserRole };
  const role = body.role ?? "readonly";
  const user: SessionUser = {
    email: body.email ?? "user@company.com",
    name: resolveSessionName(body.email ?? "user@company.com", body.name),
    role,
  };

  const res = NextResponse.json({ user });
  res.cookies.set(SESSION_COOKIE, encodeSession(user), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
