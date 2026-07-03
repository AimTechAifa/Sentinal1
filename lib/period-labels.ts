import type { Period } from "@/lib/period-range";

export const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: "month", label: "Monthly" },
  { value: "quarter", label: "Quarterly" },
  { value: "year", label: "Yearly" },
];

export function periodLabel(period: Period): string {
  return PERIOD_OPTIONS.find((o) => o.value === period)?.label ?? "Monthly";
}

export function snapshotHeading(period: Period): string {
  switch (period) {
    case "month":
      return "Snapshot of releases for this month";
    case "quarter":
      return "Snapshot of releases for this quarter";
    case "year":
      return "Snapshot of releases for this year";
    default:
      return "Snapshot of releases for this month";
  }
}
