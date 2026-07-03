type BookingLike = {
  id?: string;
  applicationId?: string;
  application?: { id: string; name: string };
  fromDate: string | Date;
  toDate: string | Date;
  status?: string;
  bookedBy?: string;
  purpose?: string | null;
  release?: { releaseCode: string } | null;
};

type ReleaseLike = {
  releaseCode: string;
  name: string;
  releaseDate: string | Date;
  status: string;
  applications: { application: { id: string; name: string } }[];
};

export type SuggestedWindow = {
  fromDate: string;
  toDate: string;
  label: string;
  conflictCount: number;
};

export type ReleaseBookingConflict = {
  releaseCode: string;
  name: string;
  releaseDate: string;
  status: string;
  applications: string[];
};

function parseDate(v: string | Date): Date {
  return typeof v === "string" ? new Date(v) : v;
}

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart <= bEnd && bStart <= aEnd;
}

function appId(b: BookingLike): string | undefined {
  return b.applicationId ?? b.application?.id;
}

function bookingConflictsForWindow(
  bookings: BookingLike[],
  appIds: Set<string>,
  from: Date,
  to: Date
): number {
  return bookings.filter((b) => {
    if ((b.status ?? "BOOKED") !== "BOOKED") return false;
    const id = appId(b);
    if (!id || !appIds.has(id)) return false;
    return overlaps(from, to, parseDate(b.fromDate), parseDate(b.toDate));
  }).length;
}

export function suggestBookingWindows(
  bookings: BookingLike[],
  applicationIds: string[],
  count = 3
): SuggestedWindow[] {
  if (!applicationIds.length) return [];

  const appIds = new Set(applicationIds);
  const suggestions: SuggestedWindow[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let startOffset = 3; startOffset <= 28 && suggestions.length < count; startOffset += 3) {
    for (const duration of [5, 7, 10]) {
      const from = new Date(today);
      from.setDate(from.getDate() + startOffset);
      const to = new Date(from);
      to.setDate(to.getDate() + duration - 1);

      const conflicts = bookingConflictsForWindow(bookings, appIds, from, to);
      if (conflicts > 0) continue;

      const fromIso = from.toISOString().slice(0, 10);
      const toIso = to.toISOString().slice(0, 10);
      if (suggestions.some((s) => s.fromDate === fromIso)) continue;

      suggestions.push({
        fromDate: fromIso,
        toDate: toIso,
        label: `${duration}-day window starting ${from.toLocaleDateString("en-AU", { day: "numeric", month: "short" })}`,
        conflictCount: 0,
      });
      if (suggestions.length >= count) break;
    }
  }

  return suggestions;
}

export function findReleaseConflicts(
  releases: ReleaseLike[],
  applicationIds: string[],
  fromDate: string,
  toDate: string
): ReleaseBookingConflict[] {
  if (!applicationIds.length || !fromDate || !toDate) return [];

  const appIds = new Set(applicationIds);
  const from = new Date(fromDate);
  const to = new Date(toDate);

  return releases
    .filter((r) => r.status !== "Complete" && r.status !== "Shipped")
    .filter((r) => {
      const sharesApp = r.applications.some((a) => appIds.has(a.application.id));
      if (!sharesApp) return false;
      const target = parseDate(r.releaseDate);
      return overlaps(from, to, target, target);
    })
    .map((r) => ({
      releaseCode: r.releaseCode,
      name: r.name,
      releaseDate:
        typeof r.releaseDate === "string"
          ? r.releaseDate
          : r.releaseDate.toISOString(),
      status: r.status,
      applications: r.applications.map((a) => a.application.name),
    }));
}

export function mappingCheckUrl(fromDate: string, toDate: string): string {
  return `/system-mapping?from=${encodeURIComponent(fromDate)}&to=${encodeURIComponent(toDate)}`;
}
