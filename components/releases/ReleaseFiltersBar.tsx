"use client";

import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import { Filter } from "lucide-react";
import { useReleaseFilters } from "@/context/ReleaseFiltersContext";
import { PERIOD_OPTIONS } from "@/lib/period-labels";
import type { Period } from "@/lib/period-range";
import { cn } from "@/lib/utils";

export function ReleaseFiltersBar({
  className,
  variant = "default",
  period,
  onPeriodChange,
  showListFilters = false,
  statusOptions = [],
  priorityOptions = [],
  impactOptions = [],
  trailing,
}: {
  className?: string;
  variant?: "default" | "large";
  period?: Period;
  onPeriodChange?: (period: Period) => void;
  showListFilters?: boolean;
  statusOptions?: string[];
  priorityOptions?: string[];
  impactOptions?: string[];
  trailing?: React.ReactNode;
}) {
  const {
    filters,
    setDepartmentId,
    setApplicationId,
    setEnvironmentId,
    setStatus,
    setPriority,
    setImpact,
    clearFilters,
    hasRefinement,
    departments,
    applications,
    envOptions,
    loading,
  } = useReleaseFilters();

  const appOptions = filters.departmentId
    ? applications.filter((a) => a.departmentId === filters.departmentId)
    : applications;

  const selectClass =
    "h-9 rounded-lg border border-gray-300 dark:border-[var(--border)] bg-white dark:bg-[var(--card)] px-3 py-1 text-sm text-gray-700 dark:text-white shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:opacity-50";

  const fields = (
    <div className="flex flex-wrap items-center gap-3">
      <select
        disabled={loading}
        value={filters.departmentId}
        onChange={(e) => setDepartmentId(e.target.value)}
        className={selectClass}
      >
        <option value="">All departments</option>
        {departments.map((d) => (
          <option key={d.id} value={d.id}>{d.name}</option>
        ))}
      </select>

      <select
        disabled={loading}
        value={filters.applicationId}
        onChange={(e) => setApplicationId(e.target.value)}
        className={selectClass}
      >
        <option value="">All applications</option>
        {appOptions.map((a) => (
          <option key={a.id} value={a.id}>{a.name}</option>
        ))}
      </select>

      <select
        disabled={loading || !envOptions.length}
        value={filters.environmentId}
        onChange={(e) => setEnvironmentId(e.target.value)}
        className={selectClass}
      >
        <option value="">All environments</option>
        {envOptions.map((e) => (
          <option key={e.id} value={e.id}>
            {e.application.name} — {e.name}
          </option>
        ))}
      </select>

      {period !== undefined && onPeriodChange && (
        <select
          value={period}
          onChange={(e) => onPeriodChange(e.target.value as Period)}
          className={selectClass}
        >
          {PERIOD_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      )}

      {showListFilters && (
        <>
          <select disabled={loading} value={filters.status} onChange={(e) => setStatus(e.target.value)} className={selectClass}>
            <option value="">All statuses</option>
            {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select disabled={loading} value={filters.priority} onChange={(e) => setPriority(e.target.value)} className={selectClass}>
            <option value="">All priorities</option>
            {priorityOptions.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <select disabled={loading} value={filters.impact} onChange={(e) => setImpact(e.target.value)} className={selectClass}>
            <option value="">All impacts</option>
            {impactOptions.map((i) => <option key={i} value={i}>{i}</option>)}
          </select>
        </>
      )}

      {hasRefinement && (
        <button 
          type="button" 
          onClick={clearFilters} 
          className="h-9 px-3 text-sm font-medium text-gray-500 dark:text-white/65 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          Clear all filters
        </button>
      )}
    </div>
  );

  return (
    <div className={cn("flex flex-wrap items-center gap-4 mb-6", className)}>
      <div className="flex items-center gap-2 text-gray-500 dark:text-white/65">
        <Filter className="h-4 w-4" />
        <span className="text-xs font-bold uppercase tracking-wider">Filter By</span>
      </div>
      {fields}
      {trailing && <div className="ml-auto flex items-center gap-2">{trailing}</div>}
    </div>
  );
}
