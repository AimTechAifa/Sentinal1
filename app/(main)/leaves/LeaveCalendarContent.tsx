"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarOff } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { TablePageToolbar } from "@/components/filters/TablePageToolbar";
import { LEAVE_SORT_PRESETS } from "@/lib/table-sort-presets";
import { DataTable, DataTableHeadRow, tableCell, tableRow } from "@/components/ui/data-table";
import { ProgressLink } from "@/components/layout/NavigationProgress";
import { FilterRangeInputs, FilterSelect, FilterTextInput, TableFilterBar } from "@/components/filters/TableFilterBar";
import {
  LEAVE_COLUMNS,
  LEAVE_DEFAULT_HIDDEN_FILTER_KEYS,
  LEAVE_FILTER_FIELDS,
} from "@/lib/table-page-columns";
import { cn, formatDate } from "@/lib/utils";
import { useFilteredFetch } from "@/hooks/useTableFilters";
import { useTablePageLoading } from "@/hooks/useTablePageLoading";
import { useTablePagePreferences } from "@/hooks/useTablePagePreferences";
import { loadJsonEffect } from "@/lib/safe-fetch";
import { TableSkeleton } from "@/components/ui/TableSkeleton";
import { PageDocumentation } from "@/components/help/PageDocumentation";
import { LEAVES_FILTER_SCHEMA } from "@/lib/table-filters";

type LeaveRow = {
  id: string;
  leaveCode: string;
  user: { id: string; userId: string; name: string; role: string; department: string };
  leaveStart: string;
  leaveEnd: string;
  leaveType: string;
  days: number;
  riskImpact: string | null;
  riskScore: number;
  affectedReleases: {
    release: { id: string; releaseCode: string; name: string; status: string; releaseDate: string };
  }[];
};

const RISK_COLOR: Record<string, string> = {
  low: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300",
  medium: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300",
  high: "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300",
};

function riskLevel(score: number): string {
  if (score <= 3) return "low";
  if (score <= 6) return "medium";
  return "high";
}

export default function LeaveCalendarContent() {
  const {
    rows: leaves,
    loading,
    values,
    setFilter,
    setSort,
    clearAll,
    hasActive,
    sortKey,
    sortDir,
    toggleSort,
  } = useFilteredFetch<LeaveRow>("/api/leaves", LEAVES_FILTER_SCHEMA, {
    defaultSortKey: "dates",
    defaultSortDir: "asc",
    sortAccessors: {
      leaveCode: (r) => r.leaveCode,
      staffMember: (r) => r.user.name,
      department: (r) => r.user.department,
      type: (r) => r.leaveType,
      dates: (r) => new Date(r.leaveStart).getTime(),
      days: (r) => r.days,
      risk: (r) => r.riskScore,
      affectedReleases: (r) => r.affectedReleases.length,
    },
  });
  const [allLeaves, setAllLeaves] = useState<LeaveRow[]>([]);

  useEffect(() => {
    return loadJsonEffect<LeaveRow[]>("/api/leaves", setAllLeaves, { label: "leaves" });
  }, []);

  const leaveTypes = useMemo(() => [...new Set(allLeaves.map((l) => l.leaveType))].sort(), [allLeaves]);
  const departments = useMemo(() => [...new Set(allLeaves.map((l) => l.user.department))].sort(), [allLeaves]);
  const highRiskCount = leaves.filter((l) => l.riskScore >= 7).length;

  const { isColumnVisible, columnPicker, filterPicker, isFilterVisible, prefsLoaded } = useTablePagePreferences(
    "leaves",
    LEAVE_COLUMNS,
    LEAVE_FILTER_FIELDS,
    {
      lockedKeys: ["leaveCode"],
      defaultHiddenFilters: LEAVE_DEFAULT_HIDDEN_FILTER_KEYS,
    }
  );

  const tablePending = useTablePageLoading(loading, prefsLoaded);

  return (
    <div>
      <TopBar
        trailing={<PageDocumentation pageKey="leaves" />}
        title="Leave & Resource Availability"
        subtitle={`${leaves.length} leave record${leaves.length === 1 ? "" : "s"}${highRiskCount > 0 ? ` · ${highRiskCount} high-risk` : ""}`}
      />
      {!tablePending && (
        <TableFilterBar hasActive={hasActive} onClear={clearAll} manageFilters={filterPicker}>
          {isFilterVisible("leaveType") && (
            <FilterSelect value={values.leaveType} onChange={(v) => setFilter("leaveType", v)}>
              <option value="">All leave types</option>
              {leaveTypes.map((t) => <option key={t} value={t}>{t}</option>)}
            </FilterSelect>
          )}
          {isFilterVisible("department") && (
            <FilterSelect value={values.department} onChange={(v) => setFilter("department", v)}>
              <option value="">All departments</option>
              {departments.map((d) => <option key={d} value={d}>{d}</option>)}
            </FilterSelect>
          )}
          {isFilterVisible("riskLevel") && (
            <FilterSelect value={values.riskLevel} onChange={(v) => setFilter("riskLevel", v)}>
              <option value="">All risk levels</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </FilterSelect>
          )}
          {isFilterVisible("staffMemberQ") && (
            <FilterTextInput
              value={values.staffMemberQ}
              onChange={(v) => setFilter("staffMemberQ", v)}
              placeholder="Staff member…"
            />
          )}
          {isFilterVisible("affectedReleaseQ") && (
            <FilterTextInput
              value={values.affectedReleaseQ}
              onChange={(v) => setFilter("affectedReleaseQ", v)}
              placeholder="Affected release…"
            />
          )}
          {isFilterVisible("leaveCodeQ") && (
            <FilterTextInput
              value={values.leaveCodeQ}
              onChange={(v) => setFilter("leaveCodeQ", v)}
              placeholder="Leave ID…"
            />
          )}
          {isFilterVisible("datesQ") && (
            <FilterTextInput
              value={values.datesQ}
              onChange={(v) => setFilter("datesQ", v)}
              placeholder="Dates (YYYY-MM-DD)…"
            />
          )}
          {isFilterVisible("days") && (
            <div className="inline-flex items-center gap-1">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Days</span>
              <FilterRangeInputs
                minValue={values.daysMin}
                maxValue={values.daysMax}
                onMinChange={(v) => setFilter("daysMin", v)}
                onMaxChange={(v) => setFilter("daysMax", v)}
              />
            </div>
          )}
        </TableFilterBar>
      )}
      {tablePending ? (
        <TableSkeleton columns={LEAVE_COLUMNS.length} />
      ) : leaves.length === 0 ? (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-12 text-center">
          <CalendarOff className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">{hasActive ? "No leave records match the selected filters." : "No leave records found."}</p>
        </div>
      ) : (
        <DataTable title="Leave Records" icon={CalendarOff} toolbar={<TablePageToolbar columnPicker={columnPicker} presets={LEAVE_SORT_PRESETS} sortKey={sortKey} sortDir={sortDir} onSelectSort={setSort} />}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <DataTableHeadRow
                  columns={LEAVE_COLUMNS}
                  isColumnVisible={isColumnVisible}
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onSort={toggleSort}
                />
              </thead>
              <tbody>
                {leaves.map((l) => (
                  <tr key={l.id} className={tableRow}>
                    {isColumnVisible("leaveCode") && <td className={`${tableCell} whitespace-nowrap`}><span className="font-mono text-xs text-brand-600">{l.leaveCode}</span></td>}
                    {isColumnVisible("staffMember") && <td className={`${tableCell} whitespace-nowrap`}>{l.user.name}</td>}
                    {isColumnVisible("department") && <td className={`${tableCell} whitespace-nowrap`}>{l.user.department}</td>}
                    {isColumnVisible("type") && <td className={`${tableCell} whitespace-nowrap`}>{l.leaveType}</td>}
                    {isColumnVisible("dates") && <td className={`${tableCell} whitespace-nowrap text-gray-500`}>{formatDate(l.leaveStart)} – {formatDate(l.leaveEnd)}</td>}
                    {isColumnVisible("days") && <td className={`${tableCell} whitespace-nowrap`}>{l.days}</td>}
                    {isColumnVisible("risk") && (
                    <td className={`${tableCell} whitespace-nowrap`}>
                      <span className={cn("inline-flex rounded-full px-2 py-0.5 text-xs font-bold capitalize", RISK_COLOR[riskLevel(l.riskScore)])}>{riskLevel(l.riskScore)}</span>
                    </td>
                    )}
                    {isColumnVisible("affectedReleases") && (
                    <td className={`${tableCell} whitespace-nowrap`}>
                      {l.affectedReleases.length === 0 ? "—" : l.affectedReleases.map((ar) => (
                        <ProgressLink key={ar.release.id} href={`/releases/${ar.release.id}`} className="text-brand-600 hover:underline text-xs mr-2">{ar.release.releaseCode}</ProgressLink>
                      ))}
                    </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DataTable>
      )}
    </div>
  );
}
