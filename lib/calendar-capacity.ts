type BookingLike = {
  fromDate: string;
  toDate: string;
  application?: { name: string };
  environment?: { name: string } | null;
  status?: string;
};

export type DayCapacity = {
  day: number;
  bookingCount: number;
  level: "none" | "low" | "medium" | "high";
};

function dayOverlapsBooking(year: number, month: number, day: number, from: Date, to: Date): boolean {
  const start = new Date(year, month, day, 0, 0, 0, 0);
  const end = new Date(year, month, day, 23, 59, 59, 999);
  return from <= end && to >= start;
}

export function computeEnvCapacityByDay(
  bookings: BookingLike[],
  year: number,
  month: number,
  daysInMonth: number
): Record<number, DayCapacity> {
  const active = bookings.filter((b) => (b.status ?? "BOOKED") === "BOOKED");
  const result: Record<number, DayCapacity> = {};

  for (let day = 1; day <= daysInMonth; day++) {
    const keys = new Set<string>();
    active.forEach((b) => {
      const from = new Date(b.fromDate);
      const to = new Date(b.toDate);
      if (!dayOverlapsBooking(year, month, day, from, to)) return;
      const app = b.application?.name ?? "app";
      const env = b.environment?.name ?? "any";
      keys.add(`${app}:${env}`);
    });
    const bookingCount = keys.size;
    let level: DayCapacity["level"] = "none";
    if (bookingCount >= 4) level = "high";
    else if (bookingCount >= 3) level = "medium";
    else if (bookingCount >= 1) level = "low";

    result[day] = { day, bookingCount, level };
  }

  return result;
}

export const capacityLevelClass: Record<DayCapacity["level"], string> = {
  none: "",
  low: "ring-1 ring-brand-200/60",
  medium: "ring-2 ring-warning-300/70 bg-warning-50/30",
  high: "ring-2 ring-error-400/60 bg-error-50/40",
};
