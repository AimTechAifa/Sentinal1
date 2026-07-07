import type { LucideIcon } from "lucide-react";
import {
  Activity,
  AlertTriangle,
  Ban,
  CheckCircle2,
  Clock,
  Rocket,
} from "lucide-react";
import type { UnifiedRelease } from "@/lib/unified-releases";

export type TimelineTone = "rose" | "amber" | "emerald" | "indigo" | "violet";

export const TIMELINE_TONES: Record<
  TimelineTone,
  { chip: string; pill: string; track: string }
> = {
  rose: {
    chip: "bg-rose-500",
    pill: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300",
    track: "from-rose-400 to-rose-500",
  },
  amber: {
    chip: "bg-amber-500",
    pill: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
    track: "from-amber-400 to-orange-500",
  },
  emerald: {
    chip: "bg-emerald-500",
    pill: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
    track: "from-emerald-400 to-teal-500",
  },
  indigo: {
    chip: "bg-indigo-500",
    pill: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300",
    track: "from-indigo-400 to-blue-500",
  },
  violet: {
    chip: "bg-violet-500",
    pill: "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300",
    track: "from-violet-400 to-purple-500",
  },
};

export const TIMELINE_LEGEND: { tone: TimelineTone; label: string }[] = [
  { tone: "rose", label: "Blocked" },
  { tone: "amber", label: "At Risk" },
  { tone: "emerald", label: "Approved" },
  { tone: "indigo", label: "In Testing" },
  { tone: "violet", label: "Planning / CAB" },
];

/** Same semantic mapping as Dashboard pipeline tiles. */
export function mapReleaseStatusToTimeline(status: string): {
  tone: TimelineTone;
  label: string;
  icon: LucideIcon;
} {
  switch (status) {
    case "Blocked":
      return { tone: "rose", label: "Blocked", icon: Ban };
    case "At Risk":
      return { tone: "amber", label: "At Risk", icon: AlertTriangle };
    case "Approved":
    case "Complete":
    case "Completed":
    case "Shipped":
      return { tone: "emerald", label: status === "Approved" ? "Approved" : status, icon: CheckCircle2 };
    case "Testing":
    case "In Testing":
    case "In Progress":
    case "Ready":
      return {
        tone: "indigo",
        label: status === "Testing" ? "In Testing" : status,
        icon: Activity,
      };
    case "Pending CAB":
      return { tone: "violet", label: "Pending CAB", icon: Clock };
    case "Planning":
    case "Planned":
    case "Scheduled":
    case "Draft":
      return { tone: "violet", label: status, icon: Rocket };
    default:
      return { tone: "violet", label: status, icon: Rocket };
  }
}

export type TimelineMilestone = {
  id: string;
  code: string;
  name: string;
  date: string;
  dateLabel: string;
  period: string;
  status: string;
  tone: TimelineTone;
  icon: LucideIcon;
  side: "up" | "down";
  href: string;
  note: string | null;
  _x: number;
};

export function formatTimelineDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-AU", { day: "numeric", month: "short" });
}

export function formatTimelinePeriod(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-AU", { month: "short", year: "numeric" });
}

export function buildStickyNote(release: UnifiedRelease): string | null {
  const blocker = release.blockers?.trim();
  if (blocker) return blocker.length > 48 ? `${blocker.slice(0, 45)}…` : blocker;
  if (release.conflictFlag) return "Env conflict flagged";
  return null;
}

const CARD_WIDTH = 200;
const MIN_GAP = CARD_WIDTH + 28;

function dateToX(date: string | Date, start: Date, end: Date, innerWidth: number, padding: number): number {
  const msRange = Math.max(end.getTime() - start.getTime(), 1);
  const t = (new Date(date).getTime() - start.getTime()) / msRange;
  return padding + Math.min(1, Math.max(0, t)) * innerWidth;
}

/** Position milestones on the track; resolve same-day / close-date collisions. */
export function layoutTimelineMilestones(
  releases: UnifiedRelease[],
  periodStart: Date,
  periodEnd: Date,
  trackWidth: number,
): TimelineMilestone[] {
  const padding = 90;
  const innerWidth = Math.max(trackWidth - 180, 120);
  const sorted = [...releases].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  const placed: { x: number; side: "up" | "down" }[] = [];

  return sorted.map((r, i) => {
    const mapped = mapReleaseStatusToTimeline(r.status);
    let x = dateToX(r.date, periodStart, periodEnd, innerWidth, padding);
    let side: "up" | "down" = i % 2 === 0 ? "up" : "down";

    const collides = (cx: number, cside: "up" | "down") =>
      placed.some((p) => Math.abs(p.x - cx) < MIN_GAP && p.side === cside);

    let attempts = 0;
    while (collides(x, side) && attempts < 12) {
      if (attempts % 2 === 0) {
        side = side === "up" ? "down" : "up";
      } else {
        x += MIN_GAP * 0.35;
      }
      attempts++;
    }

    placed.push({ x, side });

    return {
      id: r.id,
      code: r.code,
      name: r.name,
      date: r.date,
      dateLabel: formatTimelineDate(r.date),
      period: formatTimelinePeriod(r.date),
      status: mapped.label,
      tone: mapped.tone,
      icon: mapped.icon,
      side,
      href: r.href,
      note: buildStickyNote(r),
      _x: x,
    };
  });
}

export type TimelinePeriodSegment = {
  period: string;
  x1: number;
  x2: number;
  tone: TimelineTone;
};

export function buildPeriodSegments(milestones: TimelineMilestone[]): TimelinePeriodSegment[] {
  const segments: TimelinePeriodSegment[] = [];
  for (const m of milestones) {
    const last = segments[segments.length - 1];
    if (last && last.period === m.period) {
      last.x2 = m._x;
    } else {
      segments.push({ period: m.period, x1: m._x, x2: m._x, tone: m.tone });
    }
  }
  return segments;
}

export function timelineTrackWidth(count: number): number {
  return Math.max(1100, count * 240);
}

export const TIMELINE_TRACK_HEIGHT = 520;
/** Axis at vertical center of the track. */
export const TIMELINE_AXIS_PERCENT = 50;

export function timelineRangeLabel(start: Date, end: Date): string {
  const sameMonth =
    start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth();
  if (sameMonth) {
    return start.toLocaleDateString("en-AU", { month: "long", year: "numeric" });
  }
  const a = start.toLocaleDateString("en-AU", { month: "short", year: "numeric" });
  const b = end.toLocaleDateString("en-AU", { month: "short", year: "numeric" });
  return `${a} – ${b}`;
}
