"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { useNavigationProgress } from "@/components/layout/NavigationProgress";
import { SentinelLogo } from "@/components/brand/SentinelLogo";
import { DotPattern } from "@/components/ui/dot-pattern";
import { MagicCard } from "@/components/ui/magic-card";
import { taBtnPrimary, taInput } from "@/lib/styles";
import { PRODUCT_TAGLINE } from "@/lib/brand";
import { ROLE_LABELS, type UserRole } from "@/lib/auth/roles";
import { LoginHelpCard } from "@/components/help/LoginHelpCard";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-500">Loading…</div>}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { start } = useNavigationProgress();
  const [role, setRole] = useState<UserRole>("editor");
  const [email, setEmail] = useState("priya@company.com");
  const [loading, setLoading] = useState(false);

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name: email.split("@")[0], role }),
    });
    start();
    router.push(searchParams.get("next") ?? "/inbox");
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-gray-50 lg:flex-row overflow-hidden">
      <DotPattern className="opacity-20" />
      <div className="relative flex flex-1 flex-col justify-center px-6 py-12 lg:w-1/2 lg:px-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto w-full max-w-md">
          <div className="mb-8">
            <SentinelLogo variant="full" priority className="h-[56px] w-auto max-w-[240px]" />
            <p className="mt-3 text-xs text-gray-500">{PRODUCT_TAGLINE}</p>
          </div>
          <h1 className="mb-2 text-title-sm font-semibold text-gray-800">Sign in with Microsoft</h1>
          <p className="mb-8 text-sm text-gray-500">
            Demo SSO — select IAM role group. Use <strong>priya@company.com</strong> for Morning Inbox “My releases”.
          </p>
          <MagicCard gradient="from-brand-200/50 via-white to-brand-100/50" innerClassName="p-6">
            <form onSubmit={signIn} className="space-y-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Work email</label>
                <input value={email} onChange={(e) => setEmail(e.target.value)} className={taInput} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">IAM role group</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["readonly", "editor", "admin"] as UserRole[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`rounded-xl border px-2 py-2 text-xs font-medium transition-colors ${
                        role === r ? "border-brand-500 bg-brand-50 text-brand-700" : "border-gray-200 text-gray-600"
                      }`}
                    >
                      {ROLE_LABELS[r]}
                    </button>
                  ))}
                </div>
              </div>
              <button type="submit" disabled={loading} className={`${taBtnPrimary} w-full`}>
                {loading ? "Signing in…" : "Sign in (Microsoft SSO demo)"}
              </button>
            </form>
          </MagicCard>
          <LoginHelpCard />
        </motion.div>
      </div>
      <div className="relative hidden flex-1 items-center justify-center bg-gradient-to-br from-brand-600 via-brand-500 to-brand-700 lg:flex px-8">
        <div className="flex flex-col items-center text-center max-w-lg">
          <div className="rounded-2xl bg-white/95 p-8 shadow-2xl">
            <SentinelLogo variant="hero" priority />
          </div>
          <p className="mt-8 text-sm text-brand-100/90 leading-relaxed max-w-sm">
            Reference data, env booking, system mapping, and role-based access — backed by PostgreSQL for this build.
          </p>
        </div>
      </div>
    </div>
  );
}
