"use client";

import { ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import { ProgressLink } from "@/components/layout/NavigationProgress";
import { AlertOctagon } from "lucide-react";
import { AdvancedCard } from "@/components/ui/advanced-card";
import type { EnterpriseReleaseImpact } from "@/lib/types";
import { cn } from "@/lib/utils";

const conditionIcons: Record<string, string> = {
  "queues paused": "⏸",
  "events paused": "📡",
  "DB freezes": "🗄",
  "apps down": "⛔",
  "customer support down": "🎧",
};

export function EnterpriseReleaseImpactPanel({ impacts }: { impacts: EnterpriseReleaseImpact[] }) {
  const activeCount = impacts.filter((i) => i.active).length;

  return (
    <AdvancedCard
      title="Enterprise Release Impact"
      subtitle={`Derived from change records and release risk · ${activeCount} active window${activeCount === 1 ? "" : "s"}`}
      icon={AlertOctagon}
      variant="ai"
    >
      <div className="space-y-4">
        {impacts.map((impact, i) => (
          <motion.div
            key={impact.releaseId}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className={cn(
              "rounded-xl border p-4 transition-all",
              impact.active
                ? "border-brand-300 bg-brand-50/50 ring-2 ring-brand-200/80 shadow-theme-sm"
                : "border-gray-100 bg-white/60 hover:border-gray-200"
            )}
          >
            <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
              <div>
                <h4 className="font-semibold text-gray-800">{impact.releaseName}</h4>
                {impact.version && <p className="text-xs text-gray-500 font-mono text-[10px] uppercase tracking-wider">{impact.version}</p>}
              </div>
              <div className="flex items-center gap-2">
                {impact.active && (
                  <span className="rounded-full bg-brand-500 px-2 py-0.5 text-[10px] font-bold uppercase text-white animate-pulse">
                    Active window
                  </span>
                )}
                <ProgressLink
                  href={`/releases/${impact.releaseId}`}
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-brand-50 hover:text-brand-600 transition-colors"
                >
                  Release <ExternalLink className="h-3 w-3" />
                </ProgressLink>
              </div>
            </div>

            <div className="mb-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1.5">
                Release prereqs / dependencies
              </p>
              <ul className="space-y-1">
                {impact.prerequisites.map((p) => (
                  <li key={p} className="text-xs text-gray-600 flex items-start gap-1.5">
                    <span className="text-brand-400 mt-0.5">→</span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1.5">
                Impact / conditions
              </p>
              <div className="flex flex-wrap gap-2">
                {impact.conditions.map((c) => (
                  <span
                    key={c}
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs text-gray-700"
                  >
                    <span>{conditionIcons[c] ?? "•"}</span>
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </AdvancedCard>
  );
}
