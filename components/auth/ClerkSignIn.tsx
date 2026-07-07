"use client";

import { SignIn } from "@clerk/nextjs";

export function ClerkSignIn() {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (!publishableKey) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        <p className="font-semibold">Sign-in is not configured for this deployment</p>
        <p className="mt-2 text-amber-900/90">
          Add <code className="rounded bg-amber-100 px-1">NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code> and{" "}
          <code className="rounded bg-amber-100 px-1">CLERK_SECRET_KEY</code> in Vercel → Project → Settings →
          Environment Variables, then redeploy.
        </p>
      </div>
    );
  }

  return (
    <SignIn
      routing="path"
      path="/sign-in"
      signUpUrl="/sign-up"
      appearance={{
        elements: {
          rootBox: "w-full",
          card: "shadow-theme-md border border-gray-200",
        },
      }}
    />
  );
}
