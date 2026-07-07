"use client";

import { SignIn } from "@clerk/nextjs";
import { useEffect, useState } from "react";

const CLERK_APPEARANCE = {
  elements: {
    rootBox: "w-full mx-auto",
    cardBox: "w-full",
    card: "shadow-theme-md border border-gray-200 bg-white",
    headerTitle: "text-gray-900",
    headerSubtitle: "text-gray-600",
    formFieldLabel: "text-gray-700",
    formFieldInput: "bg-white text-gray-900 border-gray-300",
    formButtonPrimary: "bg-brand-500 hover:bg-brand-600",
    footerActionLink: "text-brand-600",
  },
} as const;

export function ClerkSignIn() {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    if (!publishableKey) return;
    const timer = window.setTimeout(() => {
      const mounted = Boolean(
        document.querySelector(
          ".cl-rootBox, .cl-signIn-root, [data-clerk-component], .cl-card, iframe[src*='clerk']"
        )
      );
      if (!mounted) setLoadFailed(true);
    }, 5000);
    return () => window.clearTimeout(timer);
  }, [publishableKey]);

  if (!publishableKey) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        <p className="font-semibold">Sign-in is not configured for this deployment</p>
        <p className="mt-2 text-amber-900/90">
          Add <code className="rounded bg-amber-100 px-1">NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code> and{" "}
          <code className="rounded bg-amber-100 px-1">CLERK_SECRET_KEY</code> in Vercel → Settings → Environment
          Variables, then redeploy.
        </p>
      </div>
    );
  }

  if (loadFailed) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-950">
        <p className="font-semibold">Clerk sign-in failed to load</p>
        <p className="mt-2 text-rose-900/90">
          In{" "}
          <a href="https://dashboard.clerk.com" className="underline font-medium" target="_blank" rel="noreferrer">
            Clerk Dashboard
          </a>{" "}
          → Configure → Domains, add{" "}
          <code className="rounded bg-rose-100 px-1">{typeof window !== "undefined" ? window.location.origin : "your Vercel URL"}</code>
          , then hard-refresh this page.
        </p>
      </div>
    );
  }

  return (
    <div className="clerk-sign-in-host w-full min-h-[420px]">
      <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" appearance={CLERK_APPEARANCE} />
    </div>
  );
}
