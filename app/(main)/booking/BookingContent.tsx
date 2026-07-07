"use client";

import { useEffect, useMemo, useState } from "react";
import { FilterSelect, TableFilterBar } from "@/components/filters/TableFilterBar";
import { PageDocumentation } from "@/components/help/PageDocumentation";
import { ColumnPicker } from "@/components/filters/ColumnPicker";
import { useColumnPreferences } from "@/hooks/useColumnPreferences";
import { useFilteredFetch } from "@/hooks/useTableFilters";
import { useTablePageLoading } from "@/hooks/useTablePageLoading";
import { TableSkeleton } from "@/components/ui/TableSkeleton";
import { BOOKING_FILTER_SCHEMA } from "@/lib/table-filters";

type BookingRow = {
  id: string;
  bookingCode: string | null;
  application: { id: string; name: string; department?: { name: string } };
  release?: { releaseCode: string } | null;
  departmentName?: string | null;
  dependencies?: string | null;
  releaseSize?: string | null;
  prodReleaseDate?: string | null;
  cabDate?: string | null;
  testEnvCode?: string | null;
  testStart?: string | null;
  testEnd?: string | null;
  testDays?: number | null;
  uatEnvCode?: string | null;
  uatStart?: string | null;
  uatEnd?: string | null;
  uatDays?: number | null;
  preProdEnvCode?: string | null;
  preProdStart?: string | null;
  preProdEnd?: string | null;
  preProdDays?: number | null;
  conflictFlag: boolean;
  purpose?: string | null;
};

const COLUMNS = [
  { key: "bookingCode", label: "Booking ID" },
  { key: "releaseId", label: "Release ID" },
  { key: "application", label: "Application" },
  { key: "department", label: "Department" },
  { key: "dependencies", label: "Dependencies" },
  { key: "releaseSize", label: "Release Size" },
  { key: "prodReleaseDate", label: "Prod Release Date" },
  { key: "cabDate", label: "CAB Date" },
  { key: "testEnvCode", label: "Test Env" },
  { key: "testStart", label: "Test Start" },
  { key: "testEnd", label: "Test End" },
  { key: "testDays", label: "Test Days" },
  { key: "uatEnvCode", label: "UAT Env" },
  { key: "uatStart", label: "UAT Start" },
  { key: "uatEnd", label: "UAT End" },
  { key: "uatDays", label: "UAT Days" },
  { key: "preProdEnvCode", label: "Pre-Prod Env" },
  { key: "preProdStart", label: "Pre-Prod Start" },
  { key: "preProdEnd", label: "Pre-Prod End" },
  { key: "preProdDays", label: "Pre-Prod Days" },
  { key: "conflictFlag", label: "Conflict Flag" },
  { key: "notes", label: "Notes" },
] as const;

function fmtDate(v?: string | null) {
  if (!v) return "";
  return new Date(v).toISOString().slice(0, 10);
}

function cellValue(row: BookingRow, key: (typeof COLUMNS)[number]["key"]) {
  switch (key) {
    case "bookingCode":
      return row.bookingCode ?? "";
    case "releaseId":
      return row.release?.releaseCode ?? "";
    case "application":
      return row.application?.name ?? "";
    case "department":
      return row.departmentName ?? row.application?.department?.name ?? "";
    case "dependencies":
      return row.dependencies ?? "NA";
    case "releaseSize":
      return row.releaseSize ?? "";
    case "prodReleaseDate":
      return fmtDate(row.prodReleaseDate);
    case "cabDate":
      return fmtDate(row.cabDate);
    case "testEnvCode":
      return row.testEnvCode ?? "";
    case "testStart":
      return fmtDate(row.testStart);
    case "testEnd":
      return fmtDate(row.testEnd);
    case "testDays":
      return row.testDays ?? "";
    case "uatEnvCode":
      return row.uatEnvCode ?? "";
    case "uatStart":
      return fmtDate(row.uatStart);
    case "uatEnd":
      return fmtDate(row.uatEnd);
    case "uatDays":
      return row.uatDays ?? "";
    case "preProdEnvCode":
      return row.preProdEnvCode ?? "";
    case "preProdStart":
      return fmtDate(row.preProdStart);
    case "preProdEnd":
      return fmtDate(row.preProdEnd);
    case "preProdDays":
      return row.preProdDays ?? "";
    case "conflictFlag":
      return row.conflictFlag ? "⚠️ CONFLICT" : "";
    case "notes":
      return row.purpose ?? "";
    default:
      return "";
  }
}

export default function BookingContent() {
  const { rows: bookings, loading, values, setFilter, clearAll, hasActive } = useFilteredFetch<BookingRow>(
    "/api/bookings",
    BOOKING_FILTER_SCHEMA
  );
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [apps, setApps] = useState<{ id: string; name: string; departmentId: string }[]>([]);
  const [envs, setEnvs] = useState<{ id: string; name: string; application: { name: string } }[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/departments").then((r) => (r.ok ? r.json() : [])),
      fetch("/api/applications").then((r) => (r.ok ? r.json() : [])),
      fetch("/api/environments").then((r) => (r.ok ? r.json() : [])),
    ]).then(([d, a, e]) => {
      setDepartments(d);
      setApps(a);
      setEnvs(e);
    });
  }, []);

  const appOptions = useMemo(
    () => (values.departmentId ? apps.filter((a) => a.departmentId === values.departmentId) : apps),
    [apps, values.departmentId]
  );

  const sorted = useMemo(
    () =>
      [...bookings].sort((a, b) => {
        const ac = a.bookingCode ?? "";
        const bc = b.bookingCode ?? "";
        if (ac && bc) return ac.localeCompare(bc, undefined, { numeric: true });
        return ac ? -1 : bc ? 1 : 0;
      }),
    [bookings]
  );

  const {
    visibleColumns,
    hideableColumns,
    hiddenColumns,
    toggleColumn,
    saveNow,
    loaded: columnsLoaded,
  } = useColumnPreferences("env-booking", [...COLUMNS], { lockedKeys: ["bookingCode"] });

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
    <div className="space-y-6 pb-12 font-sans">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-[#111827] dark:text-white tracking-tight">Environment Booking</h1>
          <p className="mt-1 text-[15px] text-gray-600 dark:text-white/60 font-medium">
            {sorted.length} booking{sorted.length === 1 ? "" : "s"} — manage and schedule deployments across all infrastructure layers.
          </p>
        </div>
        <PageDocumentation pageKey="env-booking" />
      </div>

      {!tablePending && (
        <TableFilterBar hasActive={hasActive} onClear={clearAll} trailing={columnPicker}>
          <FilterSelect value={values.departmentId} onChange={(v) => setFilter("departmentId", v)}>
            <option value="">All departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect value={values.applicationId} onChange={(v) => setFilter("applicationId", v)}>
            <option value="">All applications</option>
            {appOptions.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect value={values.environmentId} onChange={(v) => setFilter("environmentId", v)}>
            <option value="">All environments</option>
            {envs.map((e) => (
              <option key={e.id} value={e.id}>
                {e.application.name} — {e.name}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect value={values.conflictFlag} onChange={(v) => setFilter("conflictFlag", v)}>
            <option value="">All bookings</option>
            <option value="1">Conflicts only</option>
            <option value="0">No conflicts</option>
          </FilterSelect>
        </TableFilterBar>
      )}

      {tablePending ? (
        <TableSkeleton showTitle={false} columns={COLUMNS.length} />
      ) : (
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[var(--card)] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[2200px] text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-white/5 text-[11px] font-bold uppercase tracking-widest text-gray-500 dark:text-white/50">
                {visibleColumns.map((col) => (
                  <th key={col.key} className="px-4 py-3 font-bold whitespace-nowrap">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={visibleColumns.length} className="p-4 text-center text-gray-500">
                    {hasActive ? "No bookings match filters." : "No data found."}
                  </td>
                </tr>
              ) : (
                sorted.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                    {visibleColumns.map((col) => {
                      const key = col.key as (typeof COLUMNS)[number]["key"];
                      const value = cellValue(row, key);
                      const isConflict = col.key === "conflictFlag" && row.conflictFlag;
                      const isNotes = col.key === "notes";
                      const display =
                        value !== ""
                          ? value
                          : col.key === "dependencies"
                            ? "NA"
                            : col.key === "conflictFlag" || col.key === "notes"
                              ? ""
                              : "—";
                      return (
                        <td
                          key={col.key}
                          className={`px-4 py-3 whitespace-nowrap text-gray-700 dark:text-white/80 ${
                            col.key === "releaseId" ? "font-semibold text-brand-600 dark:text-brand-400" : ""
                          } ${isConflict ? "font-medium text-error-600 dark:text-rose-400" : ""} ${
                            isNotes ? "max-w-[280px] truncate" : ""
                          }`}
                          title={isNotes ? String(value) : undefined}
                        >
                          {display}
                        </td>
                      );
                    })}
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
