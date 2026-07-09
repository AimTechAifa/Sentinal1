"use client";

import { useEffect, useState } from "react";
import { ProgressLink } from "@/components/layout/NavigationProgress";
import { InboxBriefingPanel } from "@/components/inbox/InboxBriefingPanel";
import { AdvancedCard } from "@/components/ui/advanced-card";
import type { InboxBriefingContext } from "@/lib/db-ai-context";
import type { TodayAction } from "@/lib/top-actions";
import { cn } from "@/lib/utils";
import { loadJsonEffect } from "@/lib/safe-fetch";
import { ArrowRight, Zap } from "lucide-react";

const URGENCY_STYLES = {
  critical: "border-error-200 bg-error-50/60 text-error-900 dark:bg-error-500/20 dark:text-error-400 dark:border-error-500/30",
  high: "border-amber-200 bg-amber-50/60 text-amber-900 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30",
  normal: "border-brand-200 bg-brand-50/40 text-brand-900 dark:bg-brand-500/20 dark:text-brand-400 dark:border-brand-500/30",
};

export function TopActionsToday({ filterQuery }: { filterQuery?: string }) {
  const [actions, setActions] = useState<TodayAction[]>([]);
  const [briefingContext, setBriefingContext] = useState<InboxBriefingContext | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    return loadJsonEffect<{ actions?: TodayAction[]; briefingContext?: InboxBriefingContext }>(
      `/api/actions/today?period=month${filterQuery ?? ""}`,
      (d) => {
        setActions(d.actions ?? []);
        setBriefingContext(d.briefingContext ?? null);
      },
      { label: "actions-today", onFinally: () => setLoading(false) },
    );
  }, [filterQuery]);

  if (loading) {
    return (
      <AdvancedCard title="Top 3 actions today" icon={Zap} variant="plain">
        <p className="text-sm text-gray-400">Loading priorities…</p>
      </AdvancedCard>
    );
  }

  if (!actions.length) {
    return (
      <AdvancedCard title="Top 3 actions today" icon={Zap} variant="plain">
        <p className="text-sm text-gray-500">Nothing urgent in scope — check the full inbox below.</p>
      </AdvancedCard>
    );
  }

  return (
    <div className="space-y-4">
      <AdvancedCard
        title="Top 3 actions today"
        subtitle="Rule-ranked priorities with AI briefing below"
        icon={Zap}
        variant="plain"
      >
        <ol className="space-y-2">
          {actions.map((action) => (
            <li key={action.rank}>
              <ProgressLink
                href={action.href}
                className={cn(
                  "flex items-start gap-3 rounded-xl border px-4 py-3 text-sm transition-colors hover:shadow-sm",
                  URGENCY_STYLES[action.urgency]
                )}
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/80 dark:bg-gray-900/80 text-xs font-bold">
                  {action.rank}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="font-medium block truncate">{action.label}</span>
                  <span className="text-xs opacity-80 mt-0.5 block">{action.detail}</span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 mt-1 opacity-50" />
              </ProgressLink>
            </li>
          ))}
        </ol>
      </AdvancedCard>

      <InboxBriefingPanel briefingContext={briefingContext} />
    </div>
  );
}
