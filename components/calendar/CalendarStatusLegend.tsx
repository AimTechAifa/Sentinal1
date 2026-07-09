"use client";

import { TIMELINE_LEGEND, TIMELINE_TONES } from "@/lib/release-timeline";

/** Shared status color legend — same mapping as Timeline / Dashboard tones. */
export function CalendarStatusLegend({ className }: { className?: string }) {
  return (
    <div className={className} aria-label="Status color legend">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
        {TIMELINE_LEGEND.map(({ tone, label }) => (
          <span
            key={tone}
            className="flex items-center gap-1.5 text-[11.5px] font-medium text-slate-600 dark:text-white/70"
          >
            <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${TIMELINE_TONES[tone].chip}`} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
