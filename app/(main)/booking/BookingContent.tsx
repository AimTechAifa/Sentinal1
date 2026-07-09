"use client";

import { useEffect, useMemo, useState } from "react";
import { FilterSelect, TableFilterBar } from "@/components/filters/TableFilterBar";
import { PageDocumentation } from "@/components/help/PageDocumentation";
import { BOOKING_COLUMNS, BOOKING_FILTER_FIELDS } from "@/lib/table-page-columns";
import { TablePageToolbar } from "@/components/filters/TablePageToolbar";
import { BOOKING_SORT_PRESETS } from "@/lib/table-sort-presets";
import { DataTableHeadRow } from "@/components/ui/data-table";
import { useFilteredFetch } from "@/hooks/useTableFilters";
import { useTablePageLoading } from "@/hooks/useTablePageLoading";
import { useTablePagePreferences } from "@/hooks/useTablePagePreferences";
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

type BookingColumnKey = (typeof BOOKING_COLUMNS)[number]["key"];

function fmtDate(v?: string | null) {
  if (!v) return "";
  return new Date(v).toISOString().slice(0, 10);
}

function cellValue(row: BookingRow, key: BookingColumnKey) {
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
  const {
    rows: bookings,
    loading,
    values,
    setFilter,
    setSort,
    clearAll,
    hasActive,
    sortKey,
    sortDir,
    toggleSort,
  } = useFilteredFetch<BookingRow>("/api/bookings", BOOKING_FILTER_SCHEMA, {
    defaultSortKey: "bookingCode",
    defaultSortDir: "asc",
    sortAccessors: {
      bookingCode: (r) => r.bookingCode ?? "",
      releaseId: (r) => r.release?.releaseCode ?? "",
      application: (r) => r.application?.name ?? "",
      department: (r) => r.departmentName ?? r.application?.department?.name ?? "",
      dependencies: (r) => r.dependencies ?? "",
      releaseSize: (r) => r.releaseSize ?? "",
      prodReleaseDate: (r) => (r.prodReleaseDate ? new Date(r.prodReleaseDate).getTime() : 0),
      cabDate: (r) => (r.cabDate ? new Date(r.cabDate).getTime() : 0),
      testEnvCode: (r) => r.testEnvCode ?? "",
      testStart: (r) => (r.testStart ? new Date(r.testStart).getTime() : 0),
      testEnd: (r) => (r.testEnd ? new Date(r.testEnd).getTime() : 0),
      testDays: (r) => r.testDays ?? 0,
      uatEnvCode: (r) => r.uatEnvCode ?? "",
      uatStart: (r) => (r.uatStart ? new Date(r.uatStart).getTime() : 0),
      uatEnd: (r) => (r.uatEnd ? new Date(r.uatEnd).getTime() : 0),
      uatDays: (r) => r.uatDays ?? 0,
      preProdEnvCode: (r) => r.preProdEnvCode ?? "",
      preProdStart: (r) => (r.preProdStart ? new Date(r.preProdStart).getTime() : 0),
      preProdEnd: (r) => (r.preProdEnd ? new Date(r.preProdEnd).getTime() : 0),
      preProdDays: (r) => r.preProdDays ?? 0,
      conflictFlag: (r) => (r.conflictFlag ? 1 : 0),
      notes: (r) => r.purpose ?? "",
    },
  });
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

  const { visibleColumns, isColumnVisible, columnPicker, filterPicker, isFilterVisible, prefsLoaded } = useTablePagePreferences(
    "env-booking",
    BOOKING_COLUMNS,
    BOOKING_FILTER_FIELDS,
    { lockedKeys: ["bookingCode"] }
  );

  const tablePending = useTablePageLoading(loading, prefsLoaded);

  return (
    <div className="space-y-6 pb-12 font-sans">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-[#111827] dark:text-white tracking-tight">Environment Booking</h1>
          <p className="mt-1 text-[15px] text-gray-600 dark:text-white/60 font-medium">
            {bookings.length} booking{bookings.length === 1 ? "" : "s"} — manage and schedule deployments across all infrastructure layers.
          </p>
        </div>
        <PageDocumentation pageKey="env-booking" />
      </div>

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
          {isFilterVisible("environmentId") && (
            <FilterSelect value={values.environmentId} onChange={(v) => setFilter("environmentId", v)}>
              <option value="">All environments</option>
              {envs.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.application.name} — {e.name}
                </option>
              ))}
            </FilterSelect>
          )}
          {isFilterVisible("conflictFlag") && (
            <FilterSelect value={values.conflictFlag} onChange={(v) => setFilter("conflictFlag", v)}>
              <option value="">All bookings</option>
              <option value="1">Conflicts only</option>
              <option value="0">No conflicts</option>
            </FilterSelect>
          )}
        </TableFilterBar>
      )}

      {tablePending ? (
        <TableSkeleton showTitle={false} columns={BOOKING_COLUMNS.length} />
      ) : (
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[var(--card)] shadow-sm overflow-hidden">
        <div className="flex items-center justify-end border-b border-gray-100 bg-gray-50/80 px-4 py-2 dark:border-gray-700 dark:bg-white/[0.03]">
          <TablePageToolbar columnPicker={columnPicker} presets={BOOKING_SORT_PRESETS} sortKey={sortKey} sortDir={sortDir} onSelectSort={setSort} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[2200px] text-left text-sm">
            <thead>
              <DataTableHeadRow
                columns={BOOKING_COLUMNS}
                isColumnVisible={isColumnVisible}
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={toggleSort}
              />
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan={visibleColumns.length} className="p-4 text-center text-gray-500">
                    {hasActive ? "No bookings match filters." : "No data found."}
                  </td>
                </tr>
              ) : (
                bookings.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                    {visibleColumns.map((col) => {
                      const key = col.key as BookingColumnKey;
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
