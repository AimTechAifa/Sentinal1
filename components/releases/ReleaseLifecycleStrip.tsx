"use client";

import {
  Calendar,
  Check,
  ClipboardCheck,
  GitBranch,
  Rocket,
  Settings2,
  TestTube2,
} from "lucide-react";
import { AdvancedCard } from "@/components/ui/advanced-card";
import type { LifecycleStageView } from "@/lib/types";
import { cn } from "@/lib/utils";

const icons: Record<string, typeof GitBranch> = {
  planning: GitBranch,
  scheduling: Calendar,
  testing: TestTube2,
  preparing: ClipboardCheck,
  managing: Settings2,
  deployment: Rocket,
};

const statusStyles: Record<string, { circle: string; line: string; text: string }> = {
  complete: {
    circle: "bg-emerald-500 text-white border-emerald-500",
    line: "bg-emerald-300 dark:bg-emerald-600",
    text: "text-emerald-700 dark:text-emerald-400",
  },
  active: {
    circle: "bg-brand-500 text-white border-brand-500 ring-4 ring-brand-500/20 dark:ring-brand-500/30",
    line: "bg-brand-300 dark:bg-brand-600",
    text: "text-brand-600 dark:text-brand-400",
  },
  pending: {
    circle: "bg-gray-100 text-gray-400 border-gray-200 dark:bg-[var(--card)] dark:text-white/40 dark:border-[var(--border)]",
    line: "bg-gray-200 dark:bg-gray-700",
    text: "text-gray-400 dark:text-white/45",
  },
  blocked: {
    circle: "bg-error-500 text-white border-error-500",
    line: "bg-error-200 dark:bg-error-700",
    text: "text-error-600 dark:text-error-400",
  },
};

export function ReleaseLifecycleStrip({ stages }: { stages: LifecycleStageView[] }) {
  return (
    <AdvancedCard title="Release Lifecycle" variant="glass" innerClassName="p-5 md:p-6 overflow-x-auto">
      <div className="flex items-center min-w-[700px] w-full pt-6 pb-20 px-8">
        {stages.map((stage, idx) => {
          const Icon = icons[stage.id] ?? GitBranch;
          const s = statusStyles[stage.status];
          const isLast = idx === stages.length - 1;

          return (
            <div key={stage.id} className={cn("relative flex items-center", isLast ? "flex-none" : "flex-1")}>
              
              <div className="relative z-10 flex flex-col items-center">
                <div
                  className={cn(
                    "w-12 h-12 rounded-full border-[3px] flex items-center justify-center shrink-0 transition-all shadow-sm",
                    s.circle,
                    stage.status === "active" && "animate-pulse ring-4 ring-brand-100 dark:ring-brand-500/20"
                  )}
                >
                  {stage.status === "complete" ? (
                    <Check className="w-5 h-5 shrink-0" strokeWidth={3} />
                  ) : (
                    <Icon className="w-5 h-5 shrink-0" />
                  )}
                </div>
                
                {/* Absolute Text Container to prevent layout shifts/cut-offs */}
                <div className="absolute top-14 left-1/2 -translate-x-1/2 w-36 text-center">
                  <p className={cn("text-xs font-bold uppercase tracking-wider mb-1", s.text)}>{stage.label}</p>
                  <p className="text-[11px] text-gray-500 dark:text-white/50 leading-snug">{stage.detail}</p>
                </div>
              </div>

              {!isLast && (
                <div className={cn("flex-1 h-1 z-0", s.line, stage.status === "pending" && "bg-gray-200 dark:bg-gray-700")} />
              )}
            </div>
          );
        })}
      </div>
    </AdvancedCard>
  );
}
