import type { Period } from "@/lib/period-range";
import { periodRange } from "@/lib/period-range";

export type ScheduleColumn = {
  key: string;
  label: string;
  subLabel?: string;
  start: Date;
  end: Date;
};

function shortDate(d: Date): string {
  return d.toLocaleDateString("en-AU", { day: "numeric", month: "short" });
}

export function buildScheduleColumns(period: Period, anchor: Date): ScheduleColumn[] {
  const { start, end } = periodRange(period, anchor);
  const columns: ScheduleColumn[] = [];

  if (period === "year") {
    for (let m = 0; m < 12; m++) {
      const colStart = new Date(start.getFullYear(), m, 1, 0, 0, 0, 0);
      const colEnd = new Date(start.getFullYear(), m + 1, 0, 23, 59, 59, 999);
      columns.push({
        key: `m-${m}`,
        label: colStart.toLocaleString("en-AU", { month: "short" }),
        subLabel: String(start.getFullYear()),
        start: colStart,
        end: colEnd,
      });
    }
    return columns;
  }

  if (period === "quarter") {
    const cursor = new Date(start);
    let week = 0;
    while (cursor <= end) {
      const colStart = new Date(cursor);
      const colEnd = new Date(cursor);
      colEnd.setDate(colEnd.getDate() + 6);
      colEnd.setHours(23, 59, 59, 999);
      if (colEnd > end) colEnd.setTime(end.getTime());
      columns.push({
        key: `w-${week}`,
        label: shortDate(colStart),
        subLabel: shortDate(colEnd),
        start: colStart,
        end: colEnd,
      });
      cursor.setDate(cursor.getDate() + 7);
      week += 1;
    }
    return columns;
  }

  const daysInMonth = end.getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    const colStart = new Date(start.getFullYear(), start.getMonth(), d, 0, 0, 0, 0);
    const colEnd = new Date(start.getFullYear(), start.getMonth(), d, 23, 59, 59, 999);
    const weekday = colStart.toLocaleDateString("en-AU", { weekday: "short" });
    columns.push({
      key: `d-${d}`,
      label: String(d),
      subLabel: weekday,
      start: colStart,
      end: colEnd,
    });
  }
  return columns;
}

export function columnIndexForDate(date: string | Date, columns: ScheduleColumn[]): number {
  const d = new Date(date);
  return columns.findIndex((c) => d >= c.start && d <= c.end);
}

export function periodTitle(period: Period, anchor: Date): string {
  const { start } = periodRange(period, anchor);
  if (period === "month") {
    return start.toLocaleString("en-AU", { month: "long", year: "numeric" });
  }
  if (period === "quarter") {
    const q = Math.floor(start.getMonth() / 3) + 1;
    return `Q${q} ${start.getFullYear()}`;
  }
  return String(start.getFullYear());
}

export function shiftPeriodAnchor(period: Period, anchor: Date, delta: number): Date {
  const next = new Date(anchor);
  if (period === "month") {
    next.setMonth(next.getMonth() + delta, 1);
  } else if (period === "quarter") {
    next.setMonth(next.getMonth() + delta * 3, 1);
  } else {
    next.setFullYear(next.getFullYear() + delta, 0, 1);
  }
  return next;
}
