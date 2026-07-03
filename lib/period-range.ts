export type Period = "month" | "quarter" | "year";

export function periodRange(period: Period, anchor = new Date()): { start: Date; end: Date } {
  const start = new Date(anchor);
  const end = new Date(anchor);

  if (period === "month") {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    end.setMonth(end.getMonth() + 1, 0);
    end.setHours(23, 59, 59, 999);
  } else if (period === "quarter") {
    const q = Math.floor(anchor.getMonth() / 3);
    start.setMonth(q * 3, 1);
    start.setHours(0, 0, 0, 0);
    end.setMonth(q * 3 + 3, 0);
    end.setHours(23, 59, 59, 999);
  } else {
    start.setMonth(0, 1);
    start.setHours(0, 0, 0, 0);
    end.setMonth(11, 31);
    end.setHours(23, 59, 59, 999);
  }
  return { start, end };
}

export function inPeriod(date: string | Date, period: Period, anchor = new Date()) {
  const { start, end } = periodRange(period, anchor);
  const d = new Date(date);
  return d >= start && d <= end;
}
