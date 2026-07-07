"use client";

import { SignUp } from "@clerk/nextjs";

export function ClerkSignUp() {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (!publishableKey) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        <p className="font-semibold">Sign-up is not configured for this deployment</p>
        <p className="mt-2 text-amber-900/90">
          Add Clerk environment variables in Vercel and redeploy to enable authentication.
        </p>
      </div>
    );
  }

  return (
    <SignUp
      routing="path"
      path="/sign-up"
      signInUrl="/sign-in"
      appearance={{
        elements: {
          rootBox: "w-full",
          card: "shadow-theme-md border border-gray-200",
        },
      }}
    />
  );
}
