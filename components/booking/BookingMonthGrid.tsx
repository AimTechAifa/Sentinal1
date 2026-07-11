"use client";

import { useMemo, useState } from "react";
import {
  BOOKING_MILESTONE_STYLE,
  BOOKING_PHASE_STYLE,
  bookingMilestones,
  bookingPhaseSegments,
  localDateIso,
  milestoneInPeriod,
  segmentInPeriod,
  segmentsForDay,
  spanEdge,
  type BookingPhaseSource,
} from "@/lib/booking-calendar";
import { periodTitle } from "@/lib/calendar-schedule";
import type { Period } from "@/lib/period-range";
import { cn } from "@/lib/utils";

const MAX_VISIBLE = 3;

export function BookingMonthGrid({
  bookings,
  viewDate,
  period,
  onSelectBooking,
  onShowDayOnTimeline,
}: {
  bookings: BookingPhaseSource[];
  viewDate: Date;
  period: Period;
  onSelectBooking: (bookingCode: string) => void;
  onShowDayOnTimeline: (dayIso: string) => void;
}) {
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  const segments = useMemo(() => {
    return bookingPhaseSegments(bookings).filter((s) => segmentInPeriod(s, period, viewDate));
  }, [bookings, period, viewDate]);

  const milestones = useMemo(() => {
    return bookingMilestones(bookings).filter((m) => milestoneInPeriod(m, period, viewDate));
  }, [bookings, period, viewDate]);

  const milestonesByDay = useMemo(() => {
    const map = new Map<string, typeof milestones>();
    for (const m of milestones) {
      if (!map.has(m.dateIso)) map.set(m.dateIso, []);
      map.get(m.dateIso)!.push(m);
    }
    return map;
  }, [milestones]);

  const { gridDays } = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const totalCells = firstDay + daysInMonth;
    const paddingAfter = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
    const prevMonthDays = new Date(year, month, 0).getDate();

    const blankBefore = Array.from({ length: firstDay }, (_, i) => {
      const d = new Date(year, month - 1, prevMonthDays - firstDay + i + 1);
      return { date: d, isCurrentMonth: false, dayStr: localDateIso(d) };
    });
    const monthDays = Array.from({ length: daysInMonth }, (_, i) => {
      const d = new Date(year, month, i + 1);
      return { date: d, isCurrentMonth: true, dayStr: localDateIso(d) };
    });
    const blankAfter = Array.from({ length: paddingAfter }, (_, i) => {
      const d = new Date(year, month + 1, i + 1);
      return { date: d, isCurrentMonth: false, dayStr: localDateIso(d) };
    });
    return { gridDays: [...blankBefore, ...monthDays, ...blankAfter] };
  }, [viewDate]);

  const todayStr = useMemo(() => localDateIso(new Date()), []);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3 text-[11px] font-medium text-slate-600 dark:text-white/70">
        <span className="font-semibold text-slate-800 dark:text-white">{periodTitle("month", viewDate)}</span>
        <span className="hidden text-slate-300 sm:inline dark:text-white/30">·</span>
        {(Object.keys(BOOKING_PHASE_STYLE) as Array<keyof typeof BOOKING_PHASE_STYLE>).map((phase) => (
          <span key={phase} className="inline-flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-sm"
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
      </div>

      <div className="overflow-hidden rounded-xl border-2 border-slate-300 bg-white shadow-sm dark:border-slate-600 dark:bg-[var(--card)]">
        <div className="grid grid-cols-7 border-b-2 border-slate-300 bg-slate-50 dark:border-slate-600 dark:bg-slate-900/50">
          {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((day) => (
            <div
              key={day}
              className="border-r border-slate-300 px-2 py-2.5 text-center text-[10px] font-bold tracking-wider text-slate-600 last:border-r-0 dark:border-slate-600 dark:text-white/55"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {gridDays.map((cell) => {
            const daySegs = segmentsForDay(segments, cell.dayStr);
            const dayMs = milestonesByDay.get(cell.dayStr) ?? [];
            const expanded = expandedDay === cell.dayStr;
            const visible = expanded ? daySegs : daySegs.slice(0, MAX_VISIBLE);
            const hidden = Math.max(0, daySegs.length - MAX_VISIBLE);

            return (
              <div
                key={cell.dayStr}
                className={cn(
                  "relative flex min-h-[140px] flex-col border-b border-r border-slate-300 p-1.5 dark:border-slate-600",
                  cell.isCurrentMonth
                    ? "bg-white dark:bg-[var(--card)]"
                    : "bg-slate-50 dark:bg-slate-900/50",
                  expanded && "z-10 ring-2 ring-inset ring-indigo-400"
                )}
              >
                <div className="mb-1 flex items-center justify-between gap-1">
                  <span
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
                      cell.isCurrentMonth ? "text-slate-800 dark:text-white" : "text-slate-400",
                      cell.dayStr === todayStr && "bg-indigo-600 text-white"
                    )}
                  >
                    {cell.date.getDate()}
                  </span>
                  {dayMs.length > 0 && (
                    <div className="flex items-center gap-0.5">
                      {dayMs.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          title={`${m.label} · ${m.bookingCode}`}
                          onClick={() => onSelectBooking(m.bookingCode)}
                          className={cn(
                            "h-2.5 w-2.5 rounded-full ring-1 ring-black/10",
                            m.conflict && "outline outline-1 outline-offset-1 outline-rose-500"
                          )}
                          style={{ backgroundColor: BOOKING_MILESTONE_STYLE[m.kind].hex }}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-1 flex-col gap-0.5">
                  {visible.map((seg) => {
                    const edge = spanEdge(seg, cell.dayStr);
                    const style = BOOKING_PHASE_STYLE[seg.phase];
                    const label =
                      edge === "start" || edge === "single"
                        ? `${seg.bookingCode} · ${style.short}`
                        : style.short;
                    return (
                      <button
                        key={`${seg.id}-${cell.dayStr}`}
                        type="button"
                        title={`${seg.bookingCode} · ${seg.phaseLabel} · ${seg.envCode}${seg.conflict ? " · CONFLICT" : ""}`}
                        onClick={() => onSelectBooking(seg.bookingCode)}
                        className={cn(
                          "min-h-[20px] truncate px-1.5 py-0.5 text-left text-[10px] font-bold leading-tight text-white shadow-sm transition hover:brightness-110",
                          edge === "single" && "rounded-md",
                          edge === "start" && "rounded-l-md rounded-r-none",
                          edge === "end" && "rounded-r-md rounded-l-none",
                          edge === "middle" && "rounded-none",
                          seg.conflict && "ring-1 ring-inset ring-rose-200"
                        )}
                        style={{ backgroundColor: style.hex }}
                      >
                        {label}
                      </button>
                    );
                  })}
                  {!expanded && hidden > 0 && (
                    <div className="mt-0.5 flex flex-wrap items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setExpandedDay(cell.dayStr)}
                        className="rounded px-1 py-0.5 text-[10px] font-bold text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-500/10"
                      >
                        +{hidden} more
                      </button>
                      <button
                        type="button"
                        onClick={() => onShowDayOnTimeline(cell.dayStr)}
                        className="rounded px-1 py-0.5 text-[10px] font-semibold text-slate-500 hover:bg-slate-100 hover:text-indigo-600 dark:text-white/50 dark:hover:bg-white/5"
                      >
                        Timeline
                      </button>
                    </div>
                  )}
                  {expanded && (
                    <div className="mt-0.5 flex flex-wrap gap-1">
                      <button
                        type="button"
                        onClick={() => setExpandedDay(null)}
                        className="rounded px-1 text-[10px] font-semibold text-slate-500 hover:text-slate-800 dark:text-white/50"
                      >
                        Collapse
                      </button>
                      <button
                        type="button"
                        onClick={() => onShowDayOnTimeline(cell.dayStr)}
                        className="rounded px-1 text-[10px] font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
                      >
                        Timeline
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
