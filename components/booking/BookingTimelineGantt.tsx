"use client";

import { useMemo, useRef } from "react";
import {
  BOOKING_MILESTONE_STYLE,
  BOOKING_PHASE_STYLE,
  bookingMilestones,
  bookingPhaseSegments,
  milestoneInPeriod,
  segmentInPeriod,
  type BookingPhaseSource,
} from "@/lib/booking-calendar";
import { periodRange, type Period } from "@/lib/period-range";
import { cn } from "@/lib/utils";

const LABEL_W = 200;
const ROW_H = 52;
const AXIS_H = 36;

function buildAxisTicks(period: Period, start: Date, end: Date): { label: string; pct: number }[] {
  const span = Math.max(1, end.getTime() - start.getTime());
  const ticks: { label: string; pct: number }[] = [];

  if (period === "year") {
    for (let m = 0; m < 12; m++) {
      const d = new Date(start.getFullYear(), m, 1);
      ticks.push({
        label: d.toLocaleString("en-AU", { month: "short" }),
        pct: ((d.getTime() - start.getTime()) / span) * 100,
      });
    }
  } else if (period === "quarter") {
    const cursor = new Date(start);
    while (cursor <= end) {
      ticks.push({
        label: cursor.toLocaleDateString("en-AU", { day: "numeric", month: "short" }),
        pct: ((cursor.getTime() - start.getTime()) / span) * 100,
      });
      cursor.setDate(cursor.getDate() + 7);
    }
  } else {
    const days = end.getDate();
    for (let d = 1; d <= days; d++) {
      if (d !== 1 && d !== days && d % 2 !== 0) continue;
      const date = new Date(start.getFullYear(), start.getMonth(), d);
      ticks.push({
        label: String(d),
        pct: ((date.getTime() - start.getTime()) / span) * 100,
      });
    }
  }
  return ticks;
}

export function BookingTimelineGantt({
  bookings,
  viewDate,
  period,
  focusDayIso,
  onSelectBooking,
}: {
  bookings: BookingPhaseSource[];
  viewDate: Date;
  period: Period;
  focusDayIso?: string | null;
  onSelectBooking: (bookingCode: string) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const { start: periodStart, end: periodEnd } = useMemo(
    () => periodRange(period, viewDate),
    [period, viewDate]
  );

  const spanMs = Math.max(1, periodEnd.getTime() - periodStart.getTime());

  const pct = (d: Date) => {
    const t = Math.min(periodEnd.getTime(), Math.max(periodStart.getTime(), d.getTime()));
    return ((t - periodStart.getTime()) / spanMs) * 100;
  };

  const rows = useMemo(() => {
    let segs = bookingPhaseSegments(bookings).filter((s) => segmentInPeriod(s, period, viewDate));
    let miles = bookingMilestones(bookings).filter((m) => milestoneInPeriod(m, period, viewDate));

    if (focusDayIso) {
      const day = new Date(`${focusDayIso}T12:00:00`);
      segs = segs.filter((s) => s.start <= day && s.end >= day);
      miles = miles.filter((m) => m.dateIso === focusDayIso);
    }

    const byBooking = new Map<
      string,
      {
        bookingId: string;
        bookingCode: string;
        applicationName: string;
        conflict: boolean;
        segments: typeof segs;
        milestones: typeof miles;
      }
    >();

    for (const s of segs) {
      if (!byBooking.has(s.bookingId)) {
        byBooking.set(s.bookingId, {
          bookingId: s.bookingId,
          bookingCode: s.bookingCode,
          applicationName: s.applicationName,
          conflict: s.conflict,
          segments: [],
          milestones: [],
        });
      }
      byBooking.get(s.bookingId)!.segments.push(s);
    }
    for (const m of miles) {
      if (!byBooking.has(m.bookingId)) {
        byBooking.set(m.bookingId, {
          bookingId: m.bookingId,
          bookingCode: m.bookingCode,
          applicationName: "",
          conflict: m.conflict,
          segments: [],
          milestones: [],
        });
      }
      byBooking.get(m.bookingId)!.milestones.push(m);
    }

    return [...byBooking.values()].sort((a, b) => a.bookingCode.localeCompare(b.bookingCode));
  }, [bookings, period, viewDate, focusDayIso]);

  const ticks = useMemo(
    () => buildAxisTicks(period, periodStart, periodEnd),
    [period, periodStart, periodEnd]
  );

  const trackMinWidth =
    period === "year" ? 1100 : period === "quarter" ? 900 : 720;

  const focusLinePct = useMemo(() => {
    if (!focusDayIso) return null;
    const d = new Date(`${focusDayIso}T12:00:00`);
    if (d < periodStart || d > periodEnd) return null;
    return pct(d);
  }, [focusDayIso, periodStart, periodEnd, spanMs]);

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border-2 border-dashed border-slate-300 bg-white px-6 py-16 text-center text-sm text-slate-500 dark:border-slate-600 dark:bg-[var(--card)] dark:text-white/50">
        {focusDayIso
          ? `No booking phases overlap ${focusDayIso} in this period.`
          : "No booking phases overlap this period."}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 text-[11px] font-medium text-slate-600 dark:text-white/70">
          {(Object.keys(BOOKING_PHASE_STYLE) as Array<keyof typeof BOOKING_PHASE_STYLE>).map((phase) => (
            <span key={phase} className="inline-flex items-center gap-1.5">
              <span
                className="h-2.5 w-3 rounded-sm"
                style={{ backgroundColor: BOOKING_PHASE_STYLE[phase].hex }}
              />
              {BOOKING_PHASE_STYLE[phase].label}
            </span>
          ))}
          <span className="inline-flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: BOOKING_MILESTONE_STYLE.cab.hex }}
            />
            CAB
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: BOOKING_MILESTONE_STYLE.prod.hex }}
            />
            Prod
          </span>
          {focusDayIso && (
            <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
              Focused on {focusDayIso}
            </span>
          )}
        </div>
        <p className="text-[11px] text-slate-400 dark:text-white/40">
          {rows.length} booking{rows.length === 1 ? "" : "s"} · scroll horizontally · click a bar for Table
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border-2 border-slate-300 bg-white shadow-sm dark:border-slate-600 dark:bg-[var(--card)]">
        <div ref={scrollRef} className="overflow-x-auto overflow-y-auto max-h-[min(70vh,720px)] [scrollbar-width:thin]">
          <div style={{ minWidth: trackMinWidth + LABEL_W }}>
            {/* Axis */}
            <div
              className="sticky top-0 z-20 flex border-b-2 border-slate-300 bg-slate-50 dark:border-slate-600 dark:bg-slate-900/80"
              style={{ height: AXIS_H }}
            >
              <div
                className="sticky left-0 z-30 flex shrink-0 items-center border-r-2 border-slate-300 bg-slate-50 px-3 text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:border-slate-600 dark:bg-slate-900/80 dark:text-white/50"
                style={{ width: LABEL_W }}
              >
                Booking
              </div>
              <div className="relative flex-1">
                {ticks.map((t) => (
                  <span
                    key={`${t.label}-${t.pct}`}
                    className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-500 dark:text-white/50"
                    style={{ left: `${t.pct}%` }}
                  >
                    {t.label}
                  </span>
                ))}
              </div>
            </div>

            {/* Rows */}
            <div className="divide-y divide-slate-200 dark:divide-slate-700">
              {rows.map((row) => (
                <div
                  key={row.bookingId}
                  className={cn(
                    "flex transition-colors hover:bg-slate-50/80 dark:hover:bg-white/[0.03]",
                    row.conflict && "bg-rose-50/40 dark:bg-rose-500/5"
                  )}
                  style={{ minHeight: ROW_H }}
                >
                  <button
                    type="button"
                    onClick={() => onSelectBooking(row.bookingCode)}
                    className="sticky left-0 z-10 flex shrink-0 flex-col justify-center border-r-2 border-slate-200 bg-white px-3 text-left dark:border-slate-700 dark:bg-[var(--card)]"
                    style={{ width: LABEL_W }}
                    title={`${row.bookingCode} · ${row.applicationName}`}
                  >
                    <span className="truncate text-[12px] font-bold text-slate-800 dark:text-white">
                      {row.bookingCode}
                    </span>
                    <span className="truncate text-[10px] text-slate-500 dark:text-white/45">
                      {row.applicationName || "—"}
                      {row.conflict ? " · Conflict" : ""}
                    </span>
                  </button>

                  <div className="relative flex-1 px-1 py-2">
                    {/* Track lane */}
                    <div className="absolute inset-x-1 inset-y-2 rounded-md bg-slate-100 dark:bg-slate-800/60" />

                    {/* Day focus line */}
                    {focusLinePct != null && (
                      <div
                        className="pointer-events-none absolute inset-y-0 z-[5] w-0.5 bg-indigo-500/70"
                        style={{ left: `${focusLinePct}%` }}
                      />
                    )}

                    {/* Phase bars */}
                    {row.segments.map((seg) => {
                      const left = pct(seg.start);
                      const right = pct(seg.end);
                      const width = Math.max(1.2, right - left);
                      const style = BOOKING_PHASE_STYLE[seg.phase];
                      return (
                        <button
                          key={seg.id}
                          type="button"
                          onClick={() => onSelectBooking(seg.bookingCode)}
                          title={`${seg.bookingCode} · ${seg.phaseLabel} · ${seg.envCode}\n${seg.startIso} → ${seg.endIso}`}
                          className={cn(
                            "absolute top-1/2 z-[2] flex h-7 -translate-y-1/2 items-center overflow-hidden rounded-md px-1.5 text-left text-[10px] font-bold text-white shadow-sm transition hover:brightness-110 hover:z-[4]",
                            seg.conflict && "ring-2 ring-rose-400 ring-offset-1 ring-offset-white dark:ring-offset-slate-900"
                          )}
                          style={{
                            left: `${left}%`,
                            width: `${width}%`,
                            backgroundColor: style.hex,
                          }}
                        >
                          <span className="truncate">
                            {style.short} · {seg.envCode}
                          </span>
                        </button>
                      );
                    })}

                    {/* CAB / Prod markers */}
                    {row.milestones.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => onSelectBooking(m.bookingCode)}
                        title={`${m.label} · ${m.dateIso}`}
                        className="absolute top-1/2 z-[3] h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow dark:border-slate-800"
                        style={{
                          left: `${pct(m.date)}%`,
                          backgroundColor: BOOKING_MILESTONE_STYLE[m.kind].hex,
                        }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
