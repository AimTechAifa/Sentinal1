"use client";

import { useMemo } from "react";
import { ProgressLink } from "@/components/layout/NavigationProgress";
import { AdvancedCard } from "@/components/ui/advanced-card";
import {
  findReleaseConflicts,
  mappingCheckUrl,
  suggestBookingWindows,
} from "@/lib/booking-assistant";
import { formatDate } from "@/lib/utils";
import { AlertTriangle, Calendar, Lightbulb } from "lucide-react";

type BookingRow = {
  applicationId?: string;
  application: { id: string; name: string };
  fromDate: string;
  toDate: string;
  status?: string;
};

type ReleaseRow = {
  releaseCode: string;
  name: string;
  releaseDate: string;
  status: string;
  applications: { application: { id: string; name: string } }[];
};

export function BookingAssistantPanel({
  bookings,
  releases,
  selectedAppIds,
  fromDate,
  toDate,
  onPickWindow,
}: {
  bookings: BookingRow[];
  releases: ReleaseRow[];
  selectedAppIds: string[];
  fromDate: string;
  toDate: string;
  onPickWindow: (from: string, to: string) => void;
}) {
  const normalizedBookings = useMemo(
    () =>
      bookings.map((b) => ({
        applicationId: b.application.id,
        application: b.application,
        fromDate: b.fromDate,
        toDate: b.toDate,
        status: b.status ?? "BOOKED",
      })),
    [bookings]
  );

  const suggestions = useMemo(
    () => suggestBookingWindows(normalizedBookings, selectedAppIds),
    [normalizedBookings, selectedAppIds]
  );

  const releaseConflicts = useMemo(
    () => findReleaseConflicts(releases, selectedAppIds, fromDate, toDate),
    [releases, selectedAppIds, fromDate, toDate]
  );

  if (!selectedAppIds.length) {
    return (
      <AdvancedCard title="Booking assistant" icon={Lightbulb} variant="glass">
        <p className="text-sm text-gray-500">Select applications to see suggested windows and release conflicts.</p>
      </AdvancedCard>
    );
  }

  return (
    <AdvancedCard title="Booking assistant" icon={Lightbulb} variant="glass">
      {suggestions.length > 0 ? (
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Suggested windows</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button
                key={s.fromDate}
                type="button"
                onClick={() => onPickWindow(s.fromDate, s.toDate)}
                className="rounded-lg border border-brand-200 bg-brand-50/50 px-3 py-2 text-left text-xs hover:bg-brand-100 transition-colors"
              >
                <span className="font-medium text-brand-800 flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> {s.label}
                </span>
                <span className="text-[10px] text-gray-500">
                  {formatDate(s.fromDate)} → {formatDate(s.toDate)} · no conflicts
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-sm text-warning-700 mb-4">No conflict-free 5–10 day windows in the next 4 weeks — try narrower apps or check calendar load.</p>
      )}

      {releaseConflicts.length > 0 && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50/60 px-3 py-2">
          <p className="text-xs font-semibold text-amber-900 flex items-center gap-1 mb-1">
            <AlertTriangle className="h-3.5 w-3.5" /> Releases sharing these apps in your date range
          </p>
          {releaseConflicts.map((r) => (
            <p key={r.releaseCode} className="text-xs text-amber-800">
              {r.releaseCode} · {r.name} · target {formatDate(r.releaseDate)} · {r.status}
            </p>
          ))}
        </div>
      )}

      {fromDate && toDate && (
        <ProgressLink
          href={mappingCheckUrl(fromDate, toDate)}
          className="text-xs font-medium text-brand-600 hover:underline"
        >
          Check system mapping risks for this window →
        </ProgressLink>
      )}
    </AdvancedCard>
  );
}
