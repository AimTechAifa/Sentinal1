"use client";

import { StickyNote } from "lucide-react";
import { ProgressLink } from "@/components/layout/NavigationProgress";
import {
  buildPeriodSegments,
  layoutTimelineMilestones,
  TIMELINE_AXIS_PERCENT,
  TIMELINE_LEGEND,
  TIMELINE_TONES,
  TIMELINE_TRACK_HEIGHT,
  timelineTrackWidth,
  type TimelineMilestone,
} from "@/lib/release-timeline";
import type { UnifiedRelease } from "@/lib/unified-releases";
import { cn } from "@/lib/utils";

function ConnectorDot({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "z-20 h-3 w-3 shrink-0 rounded-full border-2 border-slate-300 bg-white ring-4 ring-slate-100 dark:border-slate-500 dark:bg-slate-800 dark:ring-slate-700",
        className,
      )}
    />
  );
}

function ConnectorLine() {
  return <span className="block h-16 w-px shrink-0 bg-slate-300 dark:bg-slate-500" />;
}

function MilestoneCard({ milestone }: { milestone: TimelineMilestone }) {
  const t = TIMELINE_TONES[milestone.tone];
  const Icon = milestone.icon;
  const isUp = milestone.side === "up";

  const card = (
    <ProgressLink
      href={milestone.href}
      className="group relative block w-[200px] rounded-2xl border border-slate-100 bg-white p-4 text-left shadow-[0_14px_30px_-18px_rgba(112,144,176,0.4)]
        transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_36px_-16px_rgba(112,144,176,0.55)]
        dark:border-slate-700 dark:bg-[var(--card)]"
    >
      <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${t.chip} text-white shadow-sm`}>
        <Icon size={16} />
      </span>
      <div className="mt-2.5 text-[13px] font-bold leading-snug text-slate-800 dark:text-white">{milestone.code}</div>
      <div className="mt-1 line-clamp-2 text-[11.5px] leading-snug text-slate-500 dark:text-white/60">{milestone.name}</div>
      <div className="mt-2">
        <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${t.pill}`}>{milestone.status}</span>
      </div>
      <div className="mt-2 text-right text-lg font-bold tracking-tight text-slate-700 dark:text-white/90">
        {milestone.dateLabel}
      </div>
      {milestone.note && (
        <div className="absolute -right-2 -top-2 max-w-[130px] rotate-6 rounded-md bg-amber-200 px-2 py-1 text-[9px] font-bold leading-tight text-amber-800 shadow-sm dark:bg-amber-400/90">
          <StickyNote size={9} className="mb-0.5 inline" /> {milestone.note}
        </div>
      )}
    </ProgressLink>
  );

  return (
    <div
      className="absolute z-10"
      style={{
        left: milestone._x,
        top: `${TIMELINE_AXIS_PERCENT}%`,
        transform: "translateX(-50%)",
      }}
    >
      {isUp ? (
        <div className="flex flex-col items-center" style={{ transform: "translateY(-100%)" }}>
          {card}
          <ConnectorLine />
          <ConnectorDot className="translate-y-1/2" />
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <ConnectorDot className="-translate-y-1/2" />
          <ConnectorLine />
          {card}
        </div>
      )}
    </div>
  );
}

export function ReleaseTimelineView({
  releases,
  periodStart,
  periodEnd,
}: {
  releases: UnifiedRelease[];
  periodStart: Date;
  periodEnd: Date;
}) {
  const trackWidth = timelineTrackWidth(releases.length);
  const milestones = layoutTimelineMilestones(releases, periodStart, periodEnd, trackWidth);
  const periods = buildPeriodSegments(milestones);

  if (releases.length === 0) {
    return (
      <div className="rounded-[24px] bg-white p-10 text-center text-slate-400 shadow-[0_18px_40px_-24px_rgba(112,144,176,0.18)] dark:bg-[var(--card)] dark:text-white/50">
        No releases in this period match the current filters.
      </div>
    );
  }

  return (
    <div className="overflow-visible rounded-[24px] bg-white px-4 py-5 shadow-[0_18px_40px_-24px_rgba(112,144,176,0.18)] dark:bg-[var(--card)]">
      <div className="overflow-x-auto overflow-y-visible py-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <div className="relative overflow-visible" style={{ width: trackWidth, height: TIMELINE_TRACK_HEIGHT }}>
          {/* Central timeline axis */}
          <div
            className="absolute left-6 right-6 z-0 h-0.5 -translate-y-1/2 bg-slate-300 dark:bg-slate-600"
            style={{ top: `${TIMELINE_AXIS_PERCENT}%` }}
          />

          {/* Colored period segments on the axis */}
          <div
            className="absolute left-0 right-0 z-[1] -translate-y-1/2"
            style={{ top: `${TIMELINE_AXIS_PERCENT}%` }}
          >
            {periods.map((p, i) => (
              <div
                key={`${p.period}-${i}`}
                className={`absolute h-3 rounded-full bg-gradient-to-r ${TIMELINE_TONES[p.tone].track} opacity-95 shadow-sm`}
                style={{ left: p.x1 - 50, width: Math.max(p.x2 - p.x1 + 100, 80) }}
              />
            ))}
          </div>

          {periods.map((p, i) => (
            <span
              key={`label-${p.period}-${i}`}
              className="absolute z-[2] rounded-full bg-slate-800 px-3 py-1 text-[10px] font-bold text-white shadow-sm dark:bg-slate-700"
              style={{
                left: (p.x1 + p.x2) / 2,
                top: `${TIMELINE_AXIS_PERCENT}%`,
                transform: "translate(-50%, calc(-50% - 2.75rem))",
              }}
            >
              {p.period}
            </span>
          ))}

          {milestones.map((m) => (
            <MilestoneCard key={m.id} milestone={m} />
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 border-t border-slate-100 pt-4 dark:border-slate-700">
        {TIMELINE_LEGEND.map(({ tone, label }) => (
          <span key={tone} className="flex items-center gap-1.5 text-[11.5px] text-slate-500 dark:text-white/55">
            <span className={`h-2.5 w-2.5 rounded-full ${TIMELINE_TONES[tone].chip}`} /> {label}
          </span>
        ))}
      </div>
    </div>
  );
}
