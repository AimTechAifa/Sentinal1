const DAY_MS = 24 * 60 * 60 * 1000;

export type DashboardPeriod = "today" | "week" | "month" | "all";

export const DASHBOARD_PERIOD_OPTIONS: { value: DashboardPeriod; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "all", label: "All" },
];

export function parseDashboardPeriod(raw: string | null): DashboardPeriod {
  if (raw === "today" || raw === "week" || raw === "month" || raw === "all") return raw;
  return "all";
}

/** Inclusive UTC window for the selected dashboard period. `null` = no date filter (All). */
export function dashboardPeriodRange(
  period: DashboardPeriod,
  anchor = new Date()
): { start: Date; end: Date } | null {
  if (period === "all") return null;

  const start = new Date(anchor);
  const end = new Date(anchor);

  if (period === "today") {
    start.setUTCHours(0, 0, 0, 0);
    end.setUTCHours(23, 59, 59, 999);
  } else if (period === "week") {
    start.setUTCDate(start.getUTCDate() - 6);
    start.setUTCHours(0, 0, 0, 0);
    end.setUTCHours(23, 59, 59, 999);
  } else {
    start.setUTCDate(1);
    start.setUTCHours(0, 0, 0, 0);
    end.setUTCMonth(end.getUTCMonth() + 1, 0);
    end.setUTCHours(23, 59, 59, 999);
  }

  return { start, end };
}

export function releaseDateFilter(range: { start: Date; end: Date } | null) {
  if (!range) return {};
  return { releaseDate: { gte: range.start, lte: range.end } };
}

export function timestampFilter(range: { start: Date; end: Date } | null) {
  if (!range) return {};
  return { timestamp: { gte: range.start, lte: range.end } };
}

export function scheduledDateFilter(range: { start: Date; end: Date } | null) {
  if (!range) return {};
  return { scheduledDate: { gte: range.start, lte: range.end } };
}

export function lastCheckFilter(range: { start: Date; end: Date } | null) {
  if (!range) return {};
  return { lastCheck: { gte: range.start, lte: range.end } };
}

export function submittedDateFilter(range: { start: Date; end: Date } | null) {
  if (!range) return {};
  return { submittedDate: { gte: range.start, lte: range.end } };
}

export function leaveOverlapFilter(range: { start: Date; end: Date } | null) {
  if (!range) return { leaveEnd: { gte: new Date() } };
  return { leaveStart: { lte: range.end }, leaveEnd: { gte: range.start } };
}

export function bookingOverlapFilter(range: { start: Date; end: Date } | null) {
  if (!range) return {};
  return { fromDate: { lte: range.end }, toDate: { gte: range.start } };
}

type TrendPoint = { date: string; count: number; label: string };

export function buildTimeBuckets(
  period: DashboardPeriod,
  range: { start: Date; end: Date } | null,
  anchor: Date
): TrendPoint[] {
  const buckets: TrendPoint[] = [];

  if (period === "today") {
    const dayStart = new Date(anchor);
    dayStart.setUTCHours(0, 0, 0, 0);
    for (let i = 0; i < 4; i++) {
      const bStart = new Date(dayStart.getTime() + i * 6 * 60 * 60 * 1000);
      buckets.push({
        date: bStart.toISOString(),
        count: 0,
        label: `${i * 6}h`,
      });
    }
    return buckets;
  }

  if (period === "week") {
    const start = range?.start ?? new Date(anchor.getTime() - 6 * DAY_MS);
    for (let i = 0; i < 7; i++) {
      const bStart = new Date(start.getTime() + i * DAY_MS);
      buckets.push({
        date: bStart.toISOString().slice(0, 10),
        count: 0,
        label: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][bStart.getUTCDay()],
      });
    }
    return buckets;
  }

  if (period === "month") {
    const start = range?.start ?? anchor;
    for (let w = 0; w < 4; w++) {
      const bStart = new Date(start.getTime() + w * 7 * DAY_MS);
      if (bStart > (range?.end ?? anchor)) break;
      buckets.push({ date: bStart.toISOString(), count: 0, label: `W${w + 1}` });
    }
    return buckets;
  }

  // all — last 12 weeks
  for (let w = 11; w >= 0; w--) {
    const bStart = new Date(anchor.getTime() - w * 7 * DAY_MS);
    bStart.setUTCHours(0, 0, 0, 0);
    buckets.push({ date: bStart.toISOString(), count: 0, label: `W${12 - w}` });
  }
  return buckets;
}

export function countInBuckets(
  buckets: TrendPoint[],
  rows: { at: Date }[],
  period: DashboardPeriod
): { date: string; count: number }[] {
  const DAY = DAY_MS;
  const SIX_H = 6 * 60 * 60 * 1000;

  return buckets.map((b, i) => {
    const bucketStart = new Date(b.date);
    let bucketEnd: Date;

    if (period === "today") {
      bucketEnd = new Date(bucketStart.getTime() + SIX_H);
    } else if (period === "week") {
      bucketEnd = new Date(bucketStart.getTime() + DAY);
    } else if (period === "month") {
      bucketEnd = new Date(bucketStart.getTime() + 7 * DAY);
    } else {
      bucketEnd = new Date(bucketStart.getTime() + 7 * DAY);
    }

    const count = rows.filter((r) => r.at >= bucketStart && r.at < bucketEnd).length;
    return { date: b.label, count };
  });
}

export function periodContextLabel(period: DashboardPeriod): string {
  switch (period) {
    case "today":
      return "today";
    case "week":
      return "this week";
    case "month":
      return "this month";
    default:
      return "across the portfolio";
  }
}
