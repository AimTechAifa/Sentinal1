import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/auth/login(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  const { pathname } = req.nextUrl;
  if (pathname === "/login" || pathname.startsWith("/login/")) {
    const signIn = new URL("/sign-in", req.url);
    const next = req.nextUrl.searchParams.get("next");
    if (next) signIn.searchParams.set("redirect_url", next);
    return NextResponse.redirect(signIn);
  }

  if (isPublicRoute(req)) return;

  const { userId } = await auth();
  if (!userId) {
    const { pathname } = req.nextUrl;
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const signIn = new URL("/sign-in", req.url);
    signIn.searchParams.set("redirect_url", req.nextUrl.pathname + req.nextUrl.search);
    return NextResponse.redirect(signIn);
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
