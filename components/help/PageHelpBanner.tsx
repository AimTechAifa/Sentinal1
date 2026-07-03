"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ProgressLink } from "@/components/layout/NavigationProgress";
import {
  dataSourceLabel,
  RELEASE_DESK_WORKFLOW,
  resolvePageGuide,
  loadDismissedHelp,
  saveDismissedHelp,
} from "@/lib/page-guide";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, CircleHelp, Lightbulb, X } from "lucide-react";

export function PageHelpBanner() {
  const pathname = usePathname();
  const guide = resolvePageGuide(pathname);
  const [expanded, setExpanded] = useState(true);
  const [dismissed, setDismissed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setDismissed(loadDismissedHelp());
  }, []);

  useEffect(() => {
    setExpanded(true);
  }, [pathname]);

  const dismiss = useCallback(() => {
    if (!guide) return;
    const next = { ...loadDismissedHelp(), [guide.key]: true };
    saveDismissedHelp(next);
    setDismissed(next);
  }, [guide]);

  if (!guide || dismissed[guide.key]) return null;

  return (
    <div
      className={cn(
        "mb-6 rounded-lg border border-[var(--border)] bg-white shadow-level-1 overflow-hidden"
      )}
      role="region"
      aria-label={`Help: ${guide.title}`}
    >
      <div className="flex items-start gap-3 px-4 py-3 md:px-5">
        <CircleHelp className="h-5 w-5 shrink-0 text-brand-600 mt-0.5" aria-hidden />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-gray-800">{guide.title}</p>
            <span className="text-[10px] uppercase tracking-wide font-medium px-2 py-0.5 rounded-full bg-white/80 border border-brand-100 text-brand-700">
              {dataSourceLabel(guide.dataSource)}
            </span>
            {guide.workflowStep != null && (
              <span className="text-[10px] text-gray-500">
                Release Desk step {guide.workflowStep} of {RELEASE_DESK_WORKFLOW.length}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 mt-1">{guide.description}</p>
        </div>
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-white/80"
            aria-expanded={expanded}
            aria-label={expanded ? "Collapse help" : "Expand help"}
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={dismiss}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-white/80"
            aria-label="Dismiss help for this page"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-[var(--border)] px-4 py-3 md:px-5 bg-gray-50/50 space-y-3">
          {guide.tips.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1.5 flex items-center gap-1">
                <Lightbulb className="h-3 w-3" /> Tips
              </p>
              <ul className="text-sm text-gray-600 space-y-1 list-disc pl-4">
                {guide.tips.map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ul>
            </div>
          )}
          {guide.related.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="text-xs text-gray-400 self-center mr-1">Go to</span>
              {guide.related.map((link) => (
                <ProgressLink
                  key={link.href}
                  href={link.href}
                  className="text-xs font-medium rounded-lg border border-brand-200 bg-white/80 px-2.5 py-1 text-brand-700 hover:bg-brand-50"
                >
                  {link.label}
                </ProgressLink>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function usePageGuide() {
  const pathname = usePathname();
  return resolvePageGuide(pathname);
}