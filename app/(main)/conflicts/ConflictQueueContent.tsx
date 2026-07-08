"use client";

import { useEffect, useMemo, useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { StatusBadge } from "@/components/badges/StatusBadge";
import { ProgressLink } from "@/components/layout/NavigationProgress";
import { FilterSelect, TableFilterBar } from "@/components/filters/TableFilterBar";
import { PageDocumentation } from "@/components/help/PageDocumentation";
import { CONFLICT_COLUMNS, CONFLICT_FILTER_FIELDS } from "@/lib/table-page-columns";
import { DataTableHeadRow, TableToolbar } from "@/components/ui/data-table";
import { cn } from "@/lib/utils";
import { useFilteredFetch } from "@/hooks/useTableFilters";
import { useTablePageLoading } from "@/hooks/useTablePageLoading";
import { useTablePagePreferences } from "@/hooks/useTablePagePreferences";
import { TableSkeleton } from "@/components/ui/TableSkeleton";
import { CONFLICTS_FILTER_SCHEMA } from "@/lib/table-filters";

type ConflictRow = {
  id: string;
  conflictCode: string;
  status: string;
  priority: string;
  assignedTo: string;
  release1Code: string;
  release2Code: string;
  release1DbId: string | null;
  release2DbId: string | null;
  application: string;
  department: string;
  conflictingEnvironment: string;
  environmentConflictType: string;
  notes: string | null;
};

const STATUS_OPTIONS = ["Open", "In Progress", "Pending Review", "Escalated", "Resolved"] as const;
const PRIORITY_OPTIONS = ["P1 - Critical", "P2 - High", "P3 - Medium"] as const;

type ConflictColumnKey = (typeof CONFLICT_COLUMNS)[number]["key"];

const PRIORITY_CLASSES: Record<string, string> = {
  "P1 - Critical": "bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300",
  "P2 - High": "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300",
  "P3 - Medium": "bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-300",
};

function ReleaseCode({ code, dbId }: { code: string; dbId: string | null }) {
  if (dbId) {
    return (
      <ProgressLink href={`/releases/${dbId}`} className="font-mono text-xs text-brand-600 hover:underline dark:text-brand-400">
        {code}
      </ProgressLink>
    );
  }
  return <span className="font-mono text-xs text-gray-800 dark:text-white/80">{code}</span>;
}

function renderConflictCell(c: ConflictRow, key: ConflictColumnKey) {
  switch (key) {
    case "conflictCode":
      return (
        <td key={key} className="px-4 py-3 font-mono text-xs font-semibold text-gray-800 dark:text-white whitespace-nowrap">
          {c.conflictCode}
        </td>
      );
    case "status":
      return (
        <td key={key} className="px-4 py-3 whitespace-nowrap">
          <StatusBadge status={c.status} />
        </td>
      );
    case "priority":
      return (
        <td key={key} className="px-4 py-3 whitespace-nowrap">
          <span className={cn("inline-flex rounded-full px-2 py-0.5 text-xs font-bold", PRIORITY_CLASSES[c.priority] ?? "")}>
            {c.priority}
          </span>
        </td>
      );
    case "assignedTo":
      return <td key={key} className="px-4 py-3 text-gray-700 dark:text-white/80 whitespace-nowrap">{c.assignedTo}</td>;
    case "release1Code":
      return (
        <td key={key} className="px-4 py-3 whitespace-nowrap">
          <ReleaseCode code={c.release1Code} dbId={c.release1DbId} />
        </td>
      );
    case "release2Code":
      return (
        <td key={key} className="px-4 py-3 whitespace-nowrap">
          <ReleaseCode code={c.release2Code} dbId={c.release2DbId} />
        </td>
      );
    case "application":
      return <td key={key} className="px-4 py-3 text-gray-700 dark:text-white/80 whitespace-nowrap">{c.application}</td>;
    case "department":
      return <td key={key} className="px-4 py-3 text-gray-700 dark:text-white/80 whitespace-nowrap">{c.department}</td>;
    case "conflictingEnvironment":
      return <td key={key} className="px-4 py-3 text-gray-600 dark:text-white/70 whitespace-nowrap">{c.conflictingEnvironment}</td>;
    case "environmentConflictType":
      return <td key={key} className="px-4 py-3 text-gray-600 dark:text-white/70 whitespace-nowrap">{c.environmentConflictType}</td>;
    case "notes":
      return (
        <td key={key} className="px-4 py-3 text-gray-600 dark:text-white/70 max-w-[280px] truncate" title={c.notes ?? ""}>
          {c.notes ?? "—"}
        </td>
      );
    default:
      return null;
  }
}

export default function ConflictQueueContent() {
  const {
    rows: conflicts,
    loading,
    values,
    setFilter,
    clearAll,
    hasActive,
    sortKey,
    sortDir,
    toggleSort,
  } = useFilteredFetch<ConflictRow>("/api/conflicts", CONFLICTS_FILTER_SCHEMA, {
    defaultSortKey: "conflictCode",
    defaultSortDir: "asc",
    sortAccessors: {
      conflictCode: (r) => r.conflictCode,
      status: (r) => r.status,
      priority: (r) => r.priority,
      assignedTo: (r) => r.assignedTo,
      release1Code: (r) => r.release1Code,
      release2Code: (r) => r.release2Code,
      application: (r) => r.application,
      department: (r) => r.department,
      conflictingEnvironment: (r) => r.conflictingEnvironment,
      environmentConflictType: (r) => r.environmentConflictType,
      notes: (r) => r.notes ?? "",
    },
  });
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [apps, setApps] = useState<{ id: string; name: string; departmentId: string }[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/departments").then((r) => (r.ok ? r.json() : [])),
      fetch("/api/applications").then((r) => (r.ok ? r.json() : [])),
    ]).then(([d, a]) => {
      setDepartments(d);
      setApps(a);
    });
  }, []);

  const appOptions = useMemo(
    () => (values.departmentId ? apps.filter((a) => a.departmentId === values.departmentId) : apps),
    [apps, values.departmentId]
  );

  const openCount = conflicts.filter((c) => c.status === "Open" || c.status === "Escalated").length;

  const { visibleColumns, isColumnVisible, columnPicker, filterPicker, isFilterVisible, prefsLoaded } = useTablePagePreferences(
    "conflicts",
    CONFLICT_COLUMNS,
    CONFLICT_FILTER_FIELDS,
    { lockedKeys: ["conflictCode"] }
  );

  const tablePending = useTablePageLoading(loading, prefsLoaded);

  return (
    <div>
      <TopBar
        trailing={<PageDocumentation pageKey="conflicts" />}
        title="Conflict Resolution Queue"
        subtitle={
          conflicts.length > 0
            ? `${conflicts.length} conflict${conflicts.length === 1 ? "" : "s"}${openCount > 0 ? ` · ${openCount} open or escalated` : ""}`
            : "No active conflicts detected"
        }
      />

      {!tablePending && (
        <TableFilterBar hasActive={hasActive} onClear={clearAll} manageFilters={filterPicker}>
          {isFilterVisible("departmentId") && (
            <FilterSelect value={values.departmentId} onChange={(v) => setFilter("departmentId", v)}>
              <option value="">All departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </FilterSelect>
          )}
          {isFilterVisible("applicationId") && (
            <FilterSelect value={values.applicationId} onChange={(v) => setFilter("applicationId", v)}>
              <option value="">All applications</option>
              {appOptions.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </FilterSelect>
          )}
          {isFilterVisible("status") && (
            <FilterSelect value={values.status} onChange={(v) => setFilter("status", v)}>
              <option value="">All statuses</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </FilterSelect>
          )}
          {isFilterVisible("priority") && (
            <FilterSelect value={values.priority} onChange={(v) => setFilter("priority", v)}>
              <option value="">All priorities</option>
              {PRIORITY_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </FilterSelect>
          )}
        </TableFilterBar>
      )}

      {tablePending ? (
        <TableSkeleton showTitle={false} columns={CONFLICT_COLUMNS.length} />
      ) : (
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden dark:border-gray-700 dark:bg-[var(--card)]">
        <div className="flex items-center justify-end border-b border-gray-100 bg-gray-50/80 px-4 py-2 dark:border-gray-700 dark:bg-white/[0.03]">
          <TableToolbar>{columnPicker}</TableToolbar>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1600px] text-left text-sm">
            <thead>
              <DataTableHeadRow
                columns={CONFLICT_COLUMNS}
                isColumnVisible={isColumnVisible}
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={toggleSort}
              />
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {conflicts.length === 0 ? (
                <tr>
                  <td colSpan={visibleColumns.length} className="p-4 text-center text-gray-500">
                    {hasActive ? "No conflicts match the selected filters." : "No conflicts recorded."}
                  </td>
                </tr>
              ) : (
                conflicts.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                    {visibleColumns.map((col) => renderConflictCell(c, col.key as ConflictColumnKey))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}
    </div>
  );
}
