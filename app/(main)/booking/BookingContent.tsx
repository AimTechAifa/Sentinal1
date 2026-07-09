"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import {
  FilterRangeInputs,
  FilterSelect,
  FilterTextInput,
  FilterTriState,
  TableFilterBar,
} from "@/components/filters/TableFilterBar";
import { ProgressLink } from "@/components/layout/NavigationProgress";
import { PageDocumentation } from "@/components/help/PageDocumentation";
import { BookingFormModal } from "@/components/booking/BookingFormModal";
import {
  BOOKING_COLUMNS,
  BOOKING_DEFAULT_HIDDEN_FILTER_KEYS,
  BOOKING_FILTER_FIELDS,
} from "@/lib/table-page-columns";
import { TablePageToolbar } from "@/components/filters/TablePageToolbar";
import { BOOKING_SORT_PRESETS } from "@/lib/table-sort-presets";
import { DataTableHeadRow } from "@/components/ui/data-table";
import { useFilteredFetch } from "@/hooks/useTableFilters";
import { useTablePageLoading } from "@/hooks/useTablePageLoading";
import { useTablePagePreferences } from "@/hooks/useTablePagePreferences";
import { TableSkeleton } from "@/components/ui/TableSkeleton";
import { BOOKING_FILTER_SCHEMA } from "@/lib/table-filters";
import { loadJsonEffect, safeFetchJson } from "@/lib/safe-fetch";
import { taBtnPrimary } from "@/lib/styles";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/lib/auth/roles";

type BookingRow = {
  id: string;
  bookingCode: string | null;
  application: { id: string; name: string; department?: { name: string } };
  release?: { id: string; releaseCode: string } | null;
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
    refetch,
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
  const [envs, setEnvs] = useState<{ id: string; name: string; applicationId: string; application: { name: string } }[]>([]);
  const [releases, setReleases] = useState<{ id: string; releaseCode: string; name: string }[]>([]);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const canEdit = user?.role === "editor" || user?.role === "admin";

  useEffect(() => {
    return loadJsonEffect<{ user: SessionUser }>("/api/auth/me", (data) => setUser(data.user), {
      label: "booking-auth",
    });
  }, []);

  useEffect(() => {
    const ac = new AbortController();
    void (async () => {
      const [deptRes, appsRes, envsRes, relRes] = await Promise.all([
        safeFetchJson<{ id: string; name: string }[]>("/api/departments", { signal: ac.signal, label: "departments" }),
        safeFetchJson<{ id: string; name: string; departmentId: string }[]>("/api/applications", { signal: ac.signal, label: "applications" }),
        safeFetchJson<{ id: string; name: string; applicationId: string; application: { name: string } }[]>(
          "/api/environments",
          { signal: ac.signal, label: "environments" },
        ),
        safeFetchJson<{ id: string; releaseCode: string; name: string }[]>("/api/releases", {
          signal: ac.signal,
          label: "releases",
        }),
      ]);
      if (ac.signal.aborted) return;
      if (deptRes.ok) setDepartments(deptRes.data);
      if (appsRes.ok) setApps(appsRes.data);
      if (envsRes.ok) setEnvs(envsRes.data);
      if (relRes.ok) setReleases(relRes.data);
    })();
    return () => ac.abort();
  }, []);

  const appOptions = useMemo(
    () => (values.departmentId ? apps.filter((a) => a.departmentId === values.departmentId) : apps),
    [apps, values.departmentId]
  );

  const releaseSizes = useMemo(
    () => [...new Set(bookings.map((b) => (b.releaseSize ?? "").trim()).filter(Boolean))].sort(),
    [bookings]
  );

  const { visibleColumns, isColumnVisible, columnPicker, filterPicker, isFilterVisible, prefsLoaded } = useTablePagePreferences(
    "env-booking",
    BOOKING_COLUMNS,
    BOOKING_FILTER_FIELDS,
    {
      lockedKeys: ["bookingCode"],
      defaultHiddenFilters: BOOKING_DEFAULT_HIDDEN_FILTER_KEYS,
    }
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
        <div className="flex shrink-0 items-center gap-2">
          {canEdit && (
            <button type="button" className={cn(taBtnPrimary, "text-sm")} onClick={() => setModalOpen(true)}>
              <Plus className="mr-1 inline h-4 w-4" /> New Booking
            </button>
          )}
          <PageDocumentation pageKey="env-booking" />
        </div>
      </div>

      <BookingFormModal
        open={modalOpen}
        departments={departments.map((d) => ({ value: d.id, label: d.name }))}
        applications={apps.map((a) => ({
          value: a.id,
          label: a.name,
          departmentId: a.departmentId,
        }))}
        environments={envs.map((e) => ({
          value: e.id,
          label: `${e.application.name} — ${e.name}`,
          applicationId: e.applicationId,
        }))}
        releases={releases.map((r) => ({
          value: r.id,
          label: `${r.releaseCode} — ${r.name}`,
        }))}
        onClose={() => setModalOpen(false)}
        onSaved={() => refetch()}
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
            <FilterTriState
              value={values.conflictFlag}
              onChange={(v) => setFilter("conflictFlag", v)}
              yesLabel="Conflicts only"
              noLabel="No conflicts"
              allLabel="All bookings"
            />
          )}
          {isFilterVisible("releaseCodeQ") && (
            <FilterTextInput
              value={values.releaseCodeQ}
              onChange={(v) => setFilter("releaseCodeQ", v)}
              placeholder="Release ID…"
            />
          )}
          {isFilterVisible("releaseSize") && (
            <FilterSelect value={values.releaseSize} onChange={(v) => setFilter("releaseSize", v)}>
              <option value="">All sizes</option>
              {releaseSizes.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </FilterSelect>
          )}
          {isFilterVisible("bookingCodeQ") && (
            <FilterTextInput
              value={values.bookingCodeQ}
              onChange={(v) => setFilter("bookingCodeQ", v)}
              placeholder="Booking ID…"
            />
          )}
          {isFilterVisible("dependenciesQ") && (
            <FilterTextInput
              value={values.dependenciesQ}
              onChange={(v) => setFilter("dependenciesQ", v)}
              placeholder="Dependencies…"
            />
          )}
          {isFilterVisible("prodReleaseDateQ") && (
            <FilterTextInput
              value={values.prodReleaseDateQ}
              onChange={(v) => setFilter("prodReleaseDateQ", v)}
              placeholder="Prod date…"
            />
          )}
          {isFilterVisible("cabDateQ") && (
            <FilterTextInput
              value={values.cabDateQ}
              onChange={(v) => setFilter("cabDateQ", v)}
              placeholder="CAB date…"
            />
          )}
          {isFilterVisible("testEnvCodeQ") && (
            <FilterTextInput
              value={values.testEnvCodeQ}
              onChange={(v) => setFilter("testEnvCodeQ", v)}
              placeholder="Test env…"
            />
          )}
          {isFilterVisible("testStartQ") && (
            <FilterTextInput
              value={values.testStartQ}
              onChange={(v) => setFilter("testStartQ", v)}
              placeholder="Test start…"
            />
          )}
          {isFilterVisible("testEndQ") && (
            <FilterTextInput
              value={values.testEndQ}
              onChange={(v) => setFilter("testEndQ", v)}
              placeholder="Test end…"
            />
          )}
          {isFilterVisible("testDays") && (
            <div className="inline-flex items-center gap-1">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Test days</span>
              <FilterRangeInputs
                minValue={values.testDaysMin}
                maxValue={values.testDaysMax}
                onMinChange={(v) => setFilter("testDaysMin", v)}
                onMaxChange={(v) => setFilter("testDaysMax", v)}
              />
            </div>
          )}
          {isFilterVisible("uatEnvCodeQ") && (
            <FilterTextInput
              value={values.uatEnvCodeQ}
              onChange={(v) => setFilter("uatEnvCodeQ", v)}
              placeholder="UAT env…"
            />
          )}
          {isFilterVisible("uatStartQ") && (
            <FilterTextInput
              value={values.uatStartQ}
              onChange={(v) => setFilter("uatStartQ", v)}
              placeholder="UAT start…"
            />
          )}
          {isFilterVisible("uatEndQ") && (
            <FilterTextInput
              value={values.uatEndQ}
              onChange={(v) => setFilter("uatEndQ", v)}
              placeholder="UAT end…"
            />
          )}
          {isFilterVisible("uatDays") && (
            <div className="inline-flex items-center gap-1">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">UAT days</span>
              <FilterRangeInputs
                minValue={values.uatDaysMin}
                maxValue={values.uatDaysMax}
                onMinChange={(v) => setFilter("uatDaysMin", v)}
                onMaxChange={(v) => setFilter("uatDaysMax", v)}
              />
            </div>
          )}
          {isFilterVisible("preProdEnvCodeQ") && (
            <FilterTextInput
              value={values.preProdEnvCodeQ}
              onChange={(v) => setFilter("preProdEnvCodeQ", v)}
              placeholder="Pre-Prod env…"
            />
          )}
          {isFilterVisible("preProdStartQ") && (
            <FilterTextInput
              value={values.preProdStartQ}
              onChange={(v) => setFilter("preProdStartQ", v)}
              placeholder="Pre-Prod start…"
            />
          )}
          {isFilterVisible("preProdEndQ") && (
            <FilterTextInput
              value={values.preProdEndQ}
              onChange={(v) => setFilter("preProdEndQ", v)}
              placeholder="Pre-Prod end…"
            />
          )}
          {isFilterVisible("preProdDays") && (
            <div className="inline-flex items-center gap-1">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Pre-Prod days</span>
              <FilterRangeInputs
                minValue={values.preProdDaysMin}
                maxValue={values.preProdDaysMax}
                onMinChange={(v) => setFilter("preProdDaysMin", v)}
                onMaxChange={(v) => setFilter("preProdDaysMax", v)}
              />
            </div>
          )}
          {isFilterVisible("notesQ") && (
            <FilterTextInput
              value={values.notesQ}
              onChange={(v) => setFilter("notesQ", v)}
              placeholder="Notes…"
            />
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
                          {col.key === "releaseId" && row.release?.id && row.release.releaseCode ? (
                            <ProgressLink
                              href={`/releases/${row.release.id}`}
                              className="font-semibold text-brand-600 hover:underline dark:text-brand-400"
                            >
                              {row.release.releaseCode}
                            </ProgressLink>
                          ) : (
                            display
                          )}
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
