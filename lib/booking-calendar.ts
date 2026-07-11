import { periodRange, type Period } from "@/lib/period-range";

export type BookingPhase = "test" | "uat" | "preProd";

export type BookingPhaseSource = {
  id: string;
  bookingCode: string | null;
  application?: { name?: string } | null;
  conflictFlag?: boolean;
  testEnvCode?: string | null;
  testStart?: string | null;
  testEnd?: string | null;
  uatEnvCode?: string | null;
  uatStart?: string | null;
  uatEnd?: string | null;
  preProdEnvCode?: string | null;
  preProdStart?: string | null;
  preProdEnd?: string | null;
  cabDate?: string | null;
  prodReleaseDate?: string | null;
};

export type BookingPhaseSegment = {
  id: string;
  bookingId: string;
  bookingCode: string;
  applicationName: string;
  phase: BookingPhase;
  phaseLabel: string;
  envCode: string;
  start: Date;
  end: Date;
  startIso: string;
  endIso: string;
  conflict: boolean;
};

export type BookingMilestone = {
  id: string;
  bookingId: string;
  bookingCode: string;
  kind: "cab" | "prod";
  label: string;
  date: Date;
  dateIso: string;
  conflict: boolean;
};

/**
 * Phase colors — shared by Calendar + Timeline.
 * Use `hex` via inline style so fills always render (Tailwind may not
 * emit classes that only appear in lib/*.ts).
 */
export const BOOKING_PHASE_STYLE: Record<
  BookingPhase,
  { label: string; short: string; hex: string; text: string }
> = {
  test: {
    label: "Test",
    short: "T",
    hex: "#0284c7",
    text: "text-white",
  },
  uat: {
    label: "UAT",
    short: "U",
    hex: "#7c3aed",
    text: "text-white",
  },
  preProd: {
    label: "Pre-Prod",
    short: "P",
    hex: "#0f766e",
    text: "text-white",
  },
};

export const BOOKING_MILESTONE_STYLE = {
  cab: {
    label: "CAB",
    hex: "#d97706",
    text: "text-amber-800 dark:text-amber-200",
  },
  prod: {
    label: "Prod",
    hex: "#e11d48",
    text: "text-rose-800 dark:text-rose-200",
  },
} as const;

function toLocalIso(d: Date): string {
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().slice(0, 10);
}

function parseDay(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

/** Expand bookings into Test / UAT / Pre-Prod segments (skip incomplete ranges). */
export function bookingPhaseSegments(bookings: BookingPhaseSource[]): BookingPhaseSegment[] {
  const out: BookingPhaseSegment[] = [];
  for (const b of bookings) {
    const code = (b.bookingCode ?? "").trim() || b.id;
    const app = b.application?.name ?? "—";
    const conflict = !!b.conflictFlag;

    const phases: {
      phase: BookingPhase;
      env: string | null | undefined;
      start: string | null | undefined;
      end: string | null | undefined;
    }[] = [
      { phase: "test", env: b.testEnvCode, start: b.testStart, end: b.testEnd },
      { phase: "uat", env: b.uatEnvCode, start: b.uatStart, end: b.uatEnd },
      { phase: "preProd", env: b.preProdEnvCode, start: b.preProdStart, end: b.preProdEnd },
    ];

    for (const p of phases) {
      const start = parseDay(p.start);
      const end = parseDay(p.end);
      if (!start || !end) continue;
      if (end < start) continue;
      out.push({
        id: `${b.id}-${p.phase}`,
        bookingId: b.id,
        bookingCode: code,
        applicationName: app,
        phase: p.phase,
        phaseLabel: BOOKING_PHASE_STYLE[p.phase].label,
        envCode: (p.env ?? "").trim() || "—",
        start,
        end: endOfDay(end),
        startIso: toLocalIso(start),
        endIso: toLocalIso(end),
        conflict,
      });
    }
  }
  return out;
}

export function bookingMilestones(bookings: BookingPhaseSource[]): BookingMilestone[] {
  const out: BookingMilestone[] = [];
  for (const b of bookings) {
    const code = (b.bookingCode ?? "").trim() || b.id;
    const conflict = !!b.conflictFlag;
    const cab = parseDay(b.cabDate);
    if (cab) {
      out.push({
        id: `${b.id}-cab`,
        bookingId: b.id,
        bookingCode: code,
        kind: "cab",
        label: "CAB",
        date: cab,
        dateIso: toLocalIso(cab),
        conflict,
      });
    }
    const prod = parseDay(b.prodReleaseDate);
    if (prod) {
      out.push({
        id: `${b.id}-prod`,
        bookingId: b.id,
        bookingCode: code,
        kind: "prod",
        label: "Prod",
        date: prod,
        dateIso: toLocalIso(prod),
        conflict,
      });
    }
  }
  return out;
}

/** Segment overlaps the visible period window (any day). */
export function segmentInPeriod(seg: BookingPhaseSegment, period: Period, anchor: Date): boolean {
  const { start, end } = periodRange(period, anchor);
  return seg.start <= end && seg.end >= start;
}

export function milestoneInPeriod(m: BookingMilestone, period: Period, anchor: Date): boolean {
  const { start, end } = periodRange(period, anchor);
  return m.date >= start && m.date <= end;
}

export function segmentsForDay(segments: BookingPhaseSegment[], dayIso: string): BookingPhaseSegment[] {
  const day = parseDay(dayIso);
  if (!day) return [];
  const dayEnd = endOfDay(day);
  return segments.filter((s) => s.start <= dayEnd && s.end >= day);
}

export function spanEdge(
  seg: BookingPhaseSegment,
  dayIso: string
): "start" | "end" | "middle" | "single" {
  if (seg.startIso === dayIso && seg.endIso === dayIso) return "single";
  if (seg.startIso === dayIso) return "start";
  if (seg.endIso === dayIso) return "end";
  return "middle";
}

export function localDateIso(d: Date): string {
  return toLocalIso(d);
}
