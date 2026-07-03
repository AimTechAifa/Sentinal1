import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { parseSession } from "@/lib/auth/cookie";
import { SESSION_COOKIE } from "@/lib/auth/roles";

const PUBLIC = ["/login", "/api/auth/login"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLIC.some((p) => pathname.startsWith(p))) return NextResponse.next();
  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon")) return NextResponse.next();
  if (/\.(?:png|jpe?g|gif|webp|svg|ico)$/i.test(pathname)) return NextResponse.next();

  const session = parseSession(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const login = new URL("/login", req.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  if (pathname.startsWith("/admin") && session.role === "readonly") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sentinel-logo\\.png).*)"],
};
