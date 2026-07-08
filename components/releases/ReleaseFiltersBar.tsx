"use client";

import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import { useReleaseFilters } from "@/context/ReleaseFiltersContext";
import { PERIOD_OPTIONS } from "@/lib/period-labels";
import type { Period } from "@/lib/period-range";
import { FilterSelect, TableFilterBar } from "@/components/filters/TableFilterBar";

export function ReleaseFiltersBar({
  className,
  variant = "default",
  period,
  onPeriodChange,
  showListFilters = false,
  statusOptions = [],
  priorityOptions = [],
  impactOptions = [],
  manageFilters,
  children,
  isFilterVisible = () => true,
}: {
  className?: string;
  variant?: "default" | "large";
  period?: Period;
  onPeriodChange?: (period: Period) => void;
  showListFilters?: boolean;
  statusOptions?: string[];
  priorityOptions?: string[];
  impactOptions?: string[];
  manageFilters?: React.ReactNode;
  children?: React.ReactNode;
  isFilterVisible?: (key: string) => boolean;
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

  return (
    <TableFilterBar className={className} hasActive={hasRefinement} onClear={clearFilters} manageFilters={manageFilters}>
      {children}

      {isFilterVisible("departmentId") && (
        <FilterSelect disabled={loading} value={filters.departmentId} onChange={setDepartmentId}>
          <option value="">All departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </FilterSelect>
      )}

      {isFilterVisible("applicationId") && (
        <FilterSelect disabled={loading} value={filters.applicationId} onChange={setApplicationId}>
          <option value="">All applications</option>
          {appOptions.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </FilterSelect>
      )}

      {isFilterVisible("environmentId") && (
        <FilterSelect disabled={loading || !envOptions.length} value={filters.environmentId} onChange={setEnvironmentId}>
          <option value="">All environments</option>
          {envOptions.map((e) => (
            <option key={e.id} value={e.id}>
              {e.application.name} — {e.name}
            </option>
          ))}
        </FilterSelect>
      )}

      {period !== undefined && onPeriodChange && (
        <FilterSelect value={period} onChange={(v) => onPeriodChange(v as Period)}>
          {PERIOD_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </FilterSelect>
      )}

      {showListFilters && isFilterVisible("status") && (
        <FilterSelect disabled={loading} value={filters.status} onChange={setStatus}>
          <option value="">All statuses</option>
          {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
        </FilterSelect>
      )}
      {showListFilters && isFilterVisible("priority") && (
        <FilterSelect disabled={loading} value={filters.priority} onChange={setPriority}>
          <option value="">All priorities</option>
          {priorityOptions.map((p) => <option key={p} value={p}>{p}</option>)}
        </FilterSelect>
      )}
      {showListFilters && isFilterVisible("impact") && (
        <FilterSelect disabled={loading} value={filters.impact} onChange={setImpact}>
          <option value="">All impacts</option>
          {impactOptions.map((i) => <option key={i} value={i}>{i}</option>)}
        </FilterSelect>
      )}

      {variant === "large" && (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          {filters.departmentId && (
            <Chip size="small" label={`Dept: ${departments.find((d) => d.id === filters.departmentId)?.name ?? filters.departmentId}`} />
          )}
        </Box>
      )}
    </TableFilterBar>
  );
}
