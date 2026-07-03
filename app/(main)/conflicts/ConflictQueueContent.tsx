"use client";

import { useEffect, useState } from "react";
import { AlertOctagon, AlertTriangle, Calendar } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { DataTable, tableCell, tableHeadRow, tableRow } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/badges/StatusBadge";
import { ProgressLink } from "@/components/layout/NavigationProgress";
import { formatDate } from "@/lib/utils";

type ConflictRelease = {
  id: string;
  releaseCode: string;
  name: string;
  status: string;
  releaseDate: string;
  department: { name: string };
  applications: { application: { name: string } }[];
};

type ConflictBooking = {
  id: string;
  application: { id: string; name: string };
  environment: { id: string; name: string } | null;
  release: { id: string; releaseCode: string; name: string } | null;
  fromDate: string;
  toDate: string;
  bookedBy: string;
  team: string;
  purpose: string | null;
  testEnvCode: string | null;
  uatEnvCode: string | null;
  preProdEnvCode: string | null;
};

export default function ConflictQueueContent() {
  const [releases, setReleases] = useState<ConflictRelease[]>([]);
  const [bookings, setBookings] = useState<ConflictBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/conflicts")
      .then((r) => (r.ok ? r.json() : { releases: [], bookings: [] }))
      .then((d) => {
        setReleases(d.releases ?? []);
        setBookings(d.bookings ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  const totalConflicts = releases.length + bookings.length;

  return (
    <div>
      <TopBar
        title="Conflict Resolution Queue"
        subtitle={
          totalConflicts > 0
            ? `${releases.length} release conflict${releases.length === 1 ? "" : "s"}, ${bookings.length} booking conflict${bookings.length === 1 ? "" : "s"}`
            : "No active conflicts detected"
        }
      />

      {loading ? (
        <p className="text-gray-500 p-6">Loading…</p>
      ) : totalConflicts === 0 ? (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-12 text-center">
          <AlertOctagon className="h-10 w-10 text-emerald-400 mx-auto mb-3" />
          <p className="text-gray-700 dark:text-gray-300 font-semibold">All clear!</p>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">No release or environment booking conflicts detected.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Release conflicts */}
          {releases.length > 0 && (
            <DataTable title="Release Conflicts" subtitle="Releases flagged with environment or scheduling conflicts" icon={AlertTriangle}>
              <table className="w-full text-sm">
                <thead className={tableHeadRow}>
                  <tr>
                    <th className={`${tableCell} text-left font-medium`}>Release</th>
                    <th className={`${tableCell} text-left font-medium`}>Name</th>
                    <th className={`${tableCell} text-left font-medium`}>Status</th>
                    <th className={`${tableCell} text-left font-medium`}>Target Date</th>
                    <th className={`${tableCell} text-left font-medium`}>Department</th>
                    <th className={`${tableCell} text-left font-medium`}>Applications</th>
                  </tr>
                </thead>
                <tbody>
                  {releases.map((r) => (
                    <tr key={r.id} className={tableRow}>
                      <td className={tableCell}>
                        <ProgressLink href={`/releases/${r.id}`} className="font-mono text-xs text-brand-600 dark:text-brand-400 hover:underline">
                          {r.releaseCode}
                        </ProgressLink>
                      </td>
                      <td className={`${tableCell} font-medium text-gray-900 dark:text-white`}>{r.name}</td>
                      <td className={tableCell}><StatusBadge status={r.status} /></td>
                      <td className={`${tableCell} text-gray-500 dark:text-gray-400`}>{formatDate(r.releaseDate)}</td>
                      <td className={`${tableCell} text-gray-600 dark:text-gray-300`}>{r.department.name}</td>
                      <td className={`${tableCell} text-xs text-gray-600 dark:text-gray-300`}>
                        {r.applications.map((a) => a.application.name).join(", ") || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </DataTable>
          )}

          {/* Booking conflicts */}
          {bookings.length > 0 && (
            <DataTable title="Booking Conflicts" subtitle="Overlapping environment booking windows" icon={Calendar}>
              <table className="w-full text-sm">
                <thead className={tableHeadRow}>
                  <tr>
                    <th className={`${tableCell} text-left font-medium`}>Application</th>
                    <th className={`${tableCell} text-left font-medium`}>Environment</th>
                    <th className={`${tableCell} text-left font-medium`}>Release</th>
                    <th className={`${tableCell} text-left font-medium`}>From</th>
                    <th className={`${tableCell} text-left font-medium`}>To</th>
                    <th className={`${tableCell} text-left font-medium`}>Booked By</th>
                    <th className={`${tableCell} text-left font-medium`}>Purpose</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => (
                    <tr key={b.id} className={tableRow}>
                      <td className={`${tableCell} font-medium text-gray-900 dark:text-white`}>{b.application.name}</td>
                      <td className={`${tableCell} text-gray-600 dark:text-gray-300`}>{b.environment?.name ?? "—"}</td>
                      <td className={tableCell}>
                        {b.release ? (
                          <ProgressLink href={`/releases/${b.release.id}`} className="font-mono text-xs text-brand-600 dark:text-brand-400 hover:underline">
                            {b.release.releaseCode}
                          </ProgressLink>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className={`${tableCell} text-gray-500 dark:text-gray-400`}>{formatDate(b.fromDate)}</td>
                      <td className={`${tableCell} text-gray-500 dark:text-gray-400`}>{formatDate(b.toDate)}</td>
                      <td className={`${tableCell} text-gray-600 dark:text-gray-300`}>{b.bookedBy}</td>
                      <td className={`${tableCell} text-xs text-gray-500 dark:text-gray-400 max-w-[200px] truncate`}>{b.purpose ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </DataTable>
          )}
        </div>
      )}
    </div>
  );
}
