"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarOff } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { DataTable, tableCell, tableHeadRow, tableRow } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/badges/StatusBadge";
import { ProgressLink } from "@/components/layout/NavigationProgress";
import { FilterSelect, TableFilterBar } from "@/components/filters/TableFilterBar";
import { ColumnPicker } from "@/components/filters/ColumnPicker";
import { useColumnPreferences } from "@/hooks/useColumnPreferences";
import { LEAVE_COLUMNS } from "@/lib/table-page-columns";
import { cn, formatDate } from "@/lib/utils";
import { useFilteredFetch } from "@/hooks/useTableFilters";
import { useTablePageLoading } from "@/hooks/useTablePageLoading";
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
  const { rows: leaves, loading, values, setFilter, clearAll, hasActive } = useFilteredFetch<LeaveRow>(
    "/api/leaves",
    LEAVES_FILTER_SCHEMA
  );
  const [allLeaves, setAllLeaves] = useState<LeaveRow[]>([]);

  useEffect(() => {
    fetch("/api/leaves").then((r) => (r.ok ? r.json() : [])).then(setAllLeaves);
  }, []);

  const leaveTypes = useMemo(() => [...new Set(allLeaves.map((l) => l.leaveType))].sort(), [allLeaves]);
  const departments = useMemo(() => [...new Set(allLeaves.map((l) => l.user.department))].sort(), [allLeaves]);
  const highRiskCount = leaves.filter((l) => l.riskScore >= 7).length;

  const {
    isColumnVisible,
    hideableColumns,
    hiddenColumns,
    toggleColumn,
    saveNow,
    loaded: columnsLoaded,
  } = useColumnPreferences("leaves", LEAVE_COLUMNS, { lockedKeys: ["leaveCode"] });

  const tablePending = useTablePageLoading(loading, columnsLoaded);

  const columnPicker = (
    <ColumnPicker
      hideableColumns={hideableColumns}
      hiddenColumns={hiddenColumns}
      toggleColumn={toggleColumn}
      saveNow={saveNow}
      loaded={columnsLoaded}
    />
  );

  return (
    <div>
      <TopBar
        trailing={<PageDocumentation pageKey="leaves" />}
        title="Leave & Resource Availability"
        subtitle={`${leaves.length} leave record${leaves.length === 1 ? "" : "s"}${highRiskCount > 0 ? ` · ${highRiskCount} high-risk` : ""}`}
      />
      {!tablePending && (
        <TableFilterBar hasActive={hasActive} onClear={clearAll} trailing={columnPicker}>
          <FilterSelect value={values.leaveType} onChange={(v) => setFilter("leaveType", v)}>
            <option value="">All leave types</option>
            {leaveTypes.map((t) => <option key={t} value={t}>{t}</option>)}
          </FilterSelect>
          <FilterSelect value={values.department} onChange={(v) => setFilter("department", v)}>
            <option value="">All departments</option>
            {departments.map((d) => <option key={d} value={d}>{d}</option>)}
          </FilterSelect>
          <FilterSelect value={values.riskLevel} onChange={(v) => setFilter("riskLevel", v)}>
            <option value="">All risk levels</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </FilterSelect>
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
        <DataTable title="Leave Records" subtitle="Staff availability and release impact" icon={CalendarOff}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className={tableHeadRow}>
                <tr>
                  {isColumnVisible("leaveCode") && <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Leave ID</th>}
                  {isColumnVisible("staffMember") && <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Staff Member</th>}
                  {isColumnVisible("department") && <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Department</th>}
                  {isColumnVisible("type") && <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Type</th>}
                  {isColumnVisible("dates") && <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Dates</th>}
                  {isColumnVisible("days") && <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Days</th>}
                  {isColumnVisible("risk") && <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Risk</th>}
                  {isColumnVisible("affectedReleases") && <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Affected Releases</th>}
                </tr>
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
