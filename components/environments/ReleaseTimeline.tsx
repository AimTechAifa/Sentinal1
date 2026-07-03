"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CalendarRange, ExternalLink, Snowflake } from "lucide-react";
import { ProgressLink } from "@/components/layout/NavigationProgress";
import { StatusBadge } from "@/components/badges/StatusBadge";
import { AdvancedCard } from "@/components/ui/advanced-card";
import type { EnterpriseDepartment, ReleaseImpact, ReleaseSize, ReleaseTimelineEntry, TimelineFreezeOverlay } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";

const DEPARTMENTS: EnterpriseDepartment[] = ["FIN", "HR", "Security", "Platform", "CRM", "Operations"];
const SIZES: ReleaseSize[] = ["high", "medium", "low"];
const IMPACTS: ReleaseImpact[] = ["high", "medium", "low"];

const sizeColors: Record<ReleaseSize, string> = {
  high: "bg-error-500",
  medium: "bg-warning-500",
  low: "bg-success-500",
};

const impactStyles: Record<ReleaseImpact, string> = {
  high: "border-error-300 bg-gradient-to-r from-error-50/90 to-error-100/50",
  medium: "border-warning-300 bg-gradient-to-r from-warning-50/90 to-warning-100/50",
  low: "border-success-300 bg-gradient-to-r from-success-50/90 to-success-100/50",
};

export function ReleaseTimeline({
  entries,
  freezeOverlays = [],
  selectedId,
  onSelect,
}: {
  entries: ReleaseTimelineEntry[];
  freezeOverlays?: TimelineFreezeOverlay[];
  selectedId?: string | null;
  onSelect?: (entry: ReleaseTimelineEntry | null) => void;
}) {
  const [deptFilter, setDeptFilter] = useState<EnterpriseDepartment | "all">("all");
  const [sizeFilter, setSizeFilter] = useState<ReleaseSize | "all">("all");
  const [impactFilter, setImpactFilter] = useState<ReleaseImpact | "all">("all");

  const filtered = useMemo(
    () =>
      entries.filter(
        (e) =>
          (deptFilter === "all" || e.department === deptFilter) &&
          (sizeFilter === "all" || e.size === sizeFilter) &&
          (impactFilter === "all" || e.impact === impactFilter)
      ),
    [entries, deptFilter, sizeFilter, impactFilter]
  );

  const { minDate, rangeMs } = useMemo(() => {
    const dates = filtered.flatMap((e) => [new Date(e.startDate), new Date(e.endDate)]);
    if (dates.length === 0) {
      const now = new Date();
      return { minDate: now, rangeMs: 86400000 * 30 };
    }
    const min = new Date(Math.min(...dates.map((d) => d.getTime())));
    const max = new Date(Math.max(...dates.map((d) => d.getTime())));
    min.setDate(min.getDate() - 3);
    max.setDate(max.getDate() + 3);
    return { minDate: min, rangeMs: max.getTime() - min.getTime() || 1 };
  }, [filtered]);

  const ticks = useMemo(() => {
    const count = 8;
    return Array.from({ length: count + 1 }, (_, i) => new Date(minDate.getTime() + (rangeMs * i) / count));
  }, [minDate, rangeMs]);

  const todayPct = ((Date.now() - minDate.getTime()) / rangeMs) * 100;
  const showToday = todayPct >= 0 && todayPct <= 100;

  const pos = (date: string) => {
    const pct = ((new Date(date).getTime() - minDate.getTime()) / rangeMs) * 100;
    return Math.min(100, Math.max(0, pct));
  };

  return (
    <AdvancedCard
      title="Release Timeline"
      subtitle="Synthetic portfolio calendar — derived from live release train data"
      icon={CalendarRange}
      variant="glass"
    >
      <div className="flex flex-wrap gap-2 mb-4">
        <FilterPills label="Dept" value={deptFilter} options={["all", ...DEPARTMENTS]} onChange={setDeptFilter} />
        <FilterPills label="Size" value={sizeFilter} options={["all", ...SIZES]} onChange={setSizeFilter} />
        <FilterPills label="Impact" value={impactFilter} options={["all", ...IMPACTS]} onChange={setImpactFilter} />
      </div>

      <div className="relative pt-2 pb-10">
        <div className="absolute left-0 right-0 top-[52px] h-0.5 bg-gray-200 rounded-full" />
        {freezeOverlays.map((fw) => {
          const left = pos(fw.startDate);
          const width = Math.max(2, pos(fw.endDate) - left);
          if (width <= 0) return null;
          return (
            <div
              key={fw.id}
              className="absolute top-[36px] bottom-2 rounded-lg bg-brand-50/60 border border-brand-100/80 z-0"
              style={{ left: `${left}%`, width: `${width}%` }}
              title={`${fw.name}: ${fw.reason}`}
            >
              <span className="absolute top-1 left-2 text-[9px] font-semibold text-brand-500 truncate max-w-full pr-2 flex items-center gap-0.5">
                <Snowflake className="h-2.5 w-2.5 shrink-0" /> {fw.name}
              </span>
            </div>
          );
        })}
        {showToday && (
          <div
            className="absolute top-[44px] bottom-4 w-0.5 bg-brand-400 z-10"
            style={{ left: `${todayPct}%` }}
          >
            <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-bold uppercase tracking-wide text-brand-500 whitespace-nowrap">
              Today
            </span>
          </div>
        )}
        <div className="flex justify-between text-[10px] text-gray-400 mb-1 px-0.5">
          {ticks.map((t, i) => (
            <span key={i} className="font-mono text-[10px] uppercase tracking-wider">
              {t.toLocaleDateString("en-AU", { month: "short", day: "numeric" })}
            </span>
          ))}
        </div>

        <div className="space-y-2 min-h-[140px]">
          {filtered.map((entry, row) => {
            const selected = selectedId === entry.id;
            return (
              <div key={entry.id} className="relative h-10">
                <motion.button
                  type="button"
                  layout
                  initial={{ opacity: 0, scaleX: 0.6 }}
                  animate={{ opacity: 1, scaleX: 1 }}
                  transition={{ delay: row * 0.04, duration: 0.35 }}
                  onClick={() => onSelect?.(selected ? null : entry)}
                  className={cn(
                    "absolute top-1 h-8 rounded-lg border flex items-center px-2 gap-1.5 text-xs font-medium shadow-sm transition-all hover:shadow-md hover:scale-[1.02] text-left overflow-hidden z-10",
                    impactStyles[entry.impact],
                    entry.inFreezeWindow && "ring-2 ring-brand-200 ring-offset-1",
                    selected && "ring-2 ring-brand-400 shadow-theme-md z-20"
                  )}
                  style={{
                    left: `${pos(entry.startDate)}%`,
                    width: `${Math.max(6, pos(entry.endDate) - pos(entry.startDate))}%`,
                    marginTop: row % 2 === 1 ? 4 : 0,
                  }}
                  title={`${entry.name} · ${formatDate(entry.startDate)} → ${formatDate(entry.endDate)}`}
                >
                  <span className={cn("h-2 w-2 rounded-full shrink-0", sizeColors[entry.size])} />
                  {entry.inFreezeWindow && <Snowflake className="h-3 w-3 shrink-0 text-brand-400" />}
                  <span className="truncate font-semibold">{entry.name}</span>
                  {entry.version && (
                    <span className="text-[10px] opacity-70 shrink-0 font-mono text-[10px] uppercase tracking-wider">{entry.version}</span>
                  )}
                  <span className="text-[10px] opacity-50 shrink-0 ml-auto">{entry.department}</span>
                </motion.button>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-6">No releases match the current filters.</p>
        )}
      </div>

      {selectedId && (() => {
        const entry = entries.find((e) => e.id === selectedId);
        if (!entry) return null;
        return (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="border-t border-gray-100 pt-4 mt-2 flex flex-wrap items-center gap-3"
          >
            <div>
              <p className="font-semibold text-gray-800">{entry.name}</p>
              <p className="text-xs text-gray-500">
                {entry.owner} · {formatDate(entry.startDate)} → {formatDate(entry.endDate)}
              </p>
            </div>
            {entry.inFreezeWindow && (
              <span className="text-xs text-brand-500 flex items-center gap-1">
                <Snowflake className="h-3 w-3" /> Overlaps {entry.freezeWindowName}
              </span>
            )}
            <StatusBadge status={entry.status} />
            {entry.releaseId && (
              <ProgressLink
                href={`/releases/${entry.releaseId}`}
                className="inline-flex items-center gap-1 rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-600 transition-colors ml-auto"
              >
                Open release <ExternalLink className="h-3 w-3" />
              </ProgressLink>
            )}
          </motion.div>
        );
      })()}

      <div className="flex flex-wrap gap-4 text-[10px] text-gray-500 border-t border-gray-100 pt-3 mt-2">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-error-500" /> High size
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-warning-500" /> Medium size
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-success-500" /> Low size
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-4 rounded bg-brand-50 border border-brand-100" /> Freeze window
        </span>
      </div>
    </AdvancedCard>
  );
}

function FilterPills<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: T[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mr-1">{label}</span>
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={cn(
            "rounded-lg px-2 py-0.5 text-xs capitalize transition-colors",
            value === opt ? "bg-brand-500 text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          )}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}
