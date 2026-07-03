"use client";

import { ProgressLink } from "@/components/layout/NavigationProgress";
import { activityFeed } from "@/lib/dummy-data";
import { activityFeedHref } from "@/lib/activity-links";
import { AgentBadge } from "@/components/badges/AgentBadge";
import type { AgentRole } from "@/lib/types";

export function AgentActivityMarquee() {
  const items = activityFeed.filter((a) => a.type === "agent" && a.agent).slice(0, 8);

  return (
    <div className="relative mb-6 rounded-2xl border border-brand-50 bg-gradient-to-r from-brand-25/80 via-white to-brand-50/80 px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-2">Recent agent activity</p>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => {
          const href = activityFeedHref(item);
          const chip = (
            <>
              {item.agent && <AgentBadge agent={item.agent as AgentRole} className="shrink-0" />}
              <span className="text-xs text-gray-600 truncate max-w-[240px]">{item.message}</span>
            </>
          );
          return href ? (
            <ProgressLink
              key={item.id}
              href={href}
              className="flex items-center gap-2 shrink-0 rounded-full border border-brand-50/80 bg-white/80 px-3 py-1.5 shadow-theme-sm max-w-full hover:border-brand-200 hover:bg-brand-50/50 transition-colors"
            >
              {chip}
            </ProgressLink>
          ) : (
            <div
              key={item.id}
              className="flex items-center gap-2 shrink-0 rounded-full border border-brand-50/80 bg-white/80 px-3 py-1.5 shadow-theme-sm max-w-full"
            >
              {chip}
            </div>
          );
        })}
      </div>
    </div>
  );
}
