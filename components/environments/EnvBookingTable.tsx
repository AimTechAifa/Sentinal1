"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CalendarCheck, ExternalLink } from "lucide-react";
import { ProgressLink } from "@/components/layout/NavigationProgress";
import { DataTable } from "@/components/ui/data-table";
import type { EnvBooking } from "@/lib/types";
import { cn } from "@/lib/utils";

const statusStyles: Record<string, { chip: string; dot: string }> = {
  IDLE: { chip: "bg-gray-100 text-gray-500 border-gray-200", dot: "bg-gray-300" },
  BOOKED: { chip: "bg-brand-100 text-brand-700 border-brand-200 ring-1 ring-brand-200/60", dot: "bg-brand-500 animate-pulse" },
  MAINTENANCE: { chip: "bg-warning-100 text-warning-700 border-warning-200", dot: "bg-warning-500" },
};

export function EnvBookingTable({
  bookings,
  highlightSystem,
}: {
  bookings: EnvBooking[];
  highlightSystem?: string;
}) {
  const systems = useMemo(() => Array.from(new Set(bookings.map((b) => b.system))), [bookings]);
  const [system, setSystem] = useState(highlightSystem ?? systems[0] ?? "SAP");
  const currentMonth = new Date().getMonth();

  useEffect(() => {
    if (highlightSystem && systems.includes(highlightSystem)) setSystem(highlightSystem);
  }, [highlightSystem, systems]);

  const rows = useMemo(() => bookings.filter((b) => b.system === system), [bookings, system]);

  return (
    <DataTable
      title="Environment Booking"
      subtitle="Monthly reservations synthesized from scheduled releases"
      icon={CalendarCheck}
      action={
        <div className="flex gap-1">
          {systems.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSystem(s)}
              className={cn(
                "rounded-lg px-2.5 py-1 text-xs font-medium transition-colors",
                system === s ? "bg-brand-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              {s}
            </button>
          ))}
        </div>
      }
    >
      <div className="p-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-1">
        {rows.map((row, i) => {
          const styles = statusStyles[row.status] || statusStyles.IDLE;
          const isCurrent = row.monthIndex === currentMonth;
          return (
            <motion.div
              key={row.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={cn(
                "rounded-xl border p-4 transition-all hover:shadow-theme-sm",
                styles.chip,
                isCurrent && "ring-2 ring-brand-300",
                row.conflict && "ring-2 ring-error-300"
              )}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className={cn("h-2 w-2 rounded-full", styles.dot)} />
                  <span className="font-bold text-sm">{row.month}</span>
                  {isCurrent && (
                    <span className="text-[9px] font-bold uppercase tracking-wide text-brand-600">Current</span>
                  )}
                  {row.conflict && (
                    <span className="text-[9px] font-bold uppercase tracking-wide text-error-600 animate-pulse">
                      Conflict ×{row.conflictCount}
                    </span>
                  )}
                </div>
                <span className="text-xs font-semibold uppercase">{row.status}</span>
              </div>
              {row.status === "BOOKED" || row.status === "MAINTENANCE" ? (
                <div className="space-y-1 text-xs">
                  <p>
                    <span className="opacity-60">Team</span> · {row.team}
                  </p>
                  <p>
                    <span className="opacity-60">Purpose</span> · {row.purpose}
                  </p>
                  <p>
                    <span className="opacity-60">Contact</span> · {row.contact}
                  </p>
                  {row.releaseId && (
                    <ProgressLink
                      href={`/releases/${row.releaseId}`}
                      className="inline-flex items-center gap-1 mt-2 text-brand-600 hover:text-brand-700 font-medium"
                    >
                      {row.version} <ExternalLink className="h-3 w-3" />
                    </ProgressLink>
                  )}
                </div>
              ) : (
                <p className="text-xs opacity-60">Available for booking</p>
              )}
            </motion.div>
          );
        })}
      </div>
    </DataTable>
  );
}
