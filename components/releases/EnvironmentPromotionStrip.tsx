"use client";

import { Globe } from "lucide-react";
import { AdvancedCard } from "@/components/ui/advanced-card";
import { buildEnvironmentPromotions } from "@/lib/environment-promotions";
import type { DeploymentPhase, Release } from "@/lib/types";
import { cn } from "@/lib/utils";

const ENV_LABELS = { dev: "Dev", staging: "Staging", prod: "Prod" } as const;
const ENV_ORDER = ["dev", "staging", "prod"] as const;

const statusStyles: Record<string, string> = {
  live: "bg-success-50 text-success-700 border-success-200",
  deploying: "bg-brand-50 text-brand-700 border-brand-200 ring-2 ring-brand-200/50",
  pending: "bg-gray-50 text-gray-500 border-gray-200",
  failed: "bg-error-50 text-error-700 border-error-200",
  "rolled-back": "bg-orange-50 text-orange-700 border-orange-200",
};

export function EnvironmentPromotionStrip({
  release,
  deployPhase,
}: {
  release: Release;
  deployPhase?: DeploymentPhase;
}) {
  const promotions = buildEnvironmentPromotions(release, deployPhase);
  const regions = Array.from(new Set(promotions.map((p) => p.region)));

  return (
    <AdvancedCard
      title="Environment & Region Promotion"
      subtitle="Version across Dev → Staging → Prod per region"
      icon={Globe}
      variant="glass"
    >
      <div className="space-y-4">
        {regions.map((region) => {
          const row = promotions.filter((p) => p.region === region);
          return (
            <div key={region} className="bg-white/60 p-4 rounded-xl border border-gray-100 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-3">{region} Region</p>
              <div className="flex items-center flex-wrap gap-2">
                {ENV_ORDER.map((env, i) => {
                  const promo = row.find((p) => p.environment === env);
                  if (!promo) return null;
                  return (
                    <div key={`${region}-${env}`} className="flex items-center">
                      <div
                        className={cn(
                          "flex flex-col rounded-xl border px-4 py-2.5 min-w-[120px] transition-all shadow-theme-sm bg-white",
                          statusStyles[promo.status]
                        )}
                      >
                        <span className="text-[10px] font-bold tracking-wider uppercase opacity-60 mb-0.5">{ENV_LABELS[env]}</span>
                        <span className="text-sm font-bold font-mono tracking-wider">{promo.version}</span>
                        <span className="text-[10px] uppercase font-bold tracking-wider mt-1 opacity-80">
                          {promo.status === "deploying" ? "Deploying…" : promo.status.replace("-", " ")}
                        </span>
                      </div>
                      
                      {i < ENV_ORDER.length - 1 && (
                        <div className="text-gray-300 mx-2">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </AdvancedCard>
  );
}
