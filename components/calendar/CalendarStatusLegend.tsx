"use client";

import { TIMELINE_LEGEND, TIMELINE_TONES } from "@/lib/release-timeline";
import { cn } from "@/lib/utils";

/** Shared status color legend — same mapping as Timeline balloon heads. */
export function CalendarStatusLegend({ className }: { className?: string }) {
  return (
    <div className={cn(className)} aria-label="Status color legend">
      <ul className="m-0 flex list-none flex-wrap items-center gap-x-5 gap-y-2 p-0">
        {TIMELINE_LEGEND.map(({ tone, label }) => (
          <li
            key={tone}
            className="inline-flex h-5 items-center gap-2 text-[11.5px] font-medium leading-none text-slate-600 dark:text-white/70"
          >
            <span
              className="inline-block h-2.5 w-2.5 shrink-0 rounded-full shadow-sm ring-1 ring-black/10 dark:ring-white/20"
              style={{ backgroundColor: TIMELINE_TONES[tone].solid }}
              aria-hidden
            />
            <span className="whitespace-nowrap">{label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
