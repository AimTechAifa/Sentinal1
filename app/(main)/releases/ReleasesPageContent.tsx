"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, Pencil, Trash2, Package } from "lucide-react";
import { ProgressLink } from "@/components/layout/NavigationProgress";
import { TopBar } from "@/components/layout/TopBar";
import { StatusBadge } from "@/components/badges/StatusBadge";
import { NeedsAttentionPanel } from "@/components/dashboard/NeedsAttentionPanel";
import { ReleaseFormModal, type ReleaseFormData } from "@/components/releases/ReleaseFormModal";
import { TablePageToolbar } from "@/components/filters/TablePageToolbar";
import { PageDocumentation } from "@/components/help/PageDocumentation";
import { ReleaseFiltersBar } from "@/components/releases/ReleaseFiltersBar";
import {
  RELEASE_COLUMNS,
  RELEASE_DEFAULT_HIDDEN_FILTER_KEYS,
  RELEASE_FILTER_FIELDS,
} from "@/lib/table-page-columns";
import { DataTable, DataTableHeadRow, dataTableTableClass, tableCell, tableHeadCell, tableHeadRow, tableRow } from "@/components/ui/data-table";
import { TableSkeleton } from "@/components/ui/TableSkeleton";
import { useTablePagePreferences } from "@/hooks/useTablePagePreferences";
import { useReleaseFilters } from "@/context/ReleaseFiltersContext";
import { useTablePageLoading } from "@/hooks/useTablePageLoading";
import { filterLabel } from "@/lib/release-filters";
import { type NeedsAttentionItem } from "@/lib/needs-attention";
import {
  dbToUnified,
  type UnifiedRelease,
} from "@/lib/unified-releases";
import { formatDate, cn } from "@/lib/utils";
import { readinessKey } from "@/lib/release-readiness-batch";
import { RELEASE_TABLE_SORT_PRESETS } from "@/lib/table-sort-presets";
import { readSortFromValues, sortRows } from "@/lib/table-sort";
import { taBtnPrimary } from "@/lib/styles";
import type { SessionUser } from "@/lib/auth/roles";
import { loadJsonEffect, safeFetchJson } from "@/lib/safe-fetch";



type ReleaseRow = {
  id: string;
  releaseCode: string;
  name: string;
  programProject: string | null;
  owner: string;
  status: string;
  releaseDate: string;
  priority: string;
  impact: string;
  departmentId: string;
  department: { name: string };
  applications: { application: { id: string; name: string } }[];
  dependsOn: { dependsOnRelease: { id: string; releaseCode: string; name: string } }[];
  conflictIds?: string[];
};

export default function ReleasesPageContent() {
  const searchParams = useSearchParams();

  const {
    filters,
    filterQuery,
    hasRefinement,
    departments,
    applications,
    environments,
    bookings,
    dbRows,
    refreshLookups,
    setSort,
    toggleSort,
    loading: filtersLoading,
  } = useReleaseFilters();

  const attentionMode = searchParams.get("attention") === "1";
  const attentionStatusFilter = attentionMode ? searchParams.get("status") : null;

  const [user, setUser] = useState<SessionUser | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editRow, setEditRow] = useState<ReleaseRow | null>(null);
  const [formPrefill, setFormPrefill] = useState<Partial<ReleaseFormData> | null>(null);
  const [attentionItems, setAttentionItems] = useState<NeedsAttentionItem[]>([]);
  const [readinessByKey, setReadinessByKey] = useState<
    Record<string, { readiness: number; blockerCount: number }>
  >({});
  type FilterOptionsState = {
    statuses: string[];
    priorities: string[];
    impacts: string[];
    approvalStatuses: string[];
    rollbackPlans: string[];
    deploymentWindows: string[];
    changeFreezes: string[];
    regulatories: string[];
    vendorMaintenances: string[];
    releaseSizes: string[];
  };

  const [filterOptions, setFilterOptions] = useState<FilterOptionsState>({
    statuses: [],
    priorities: [],
    impacts: [],
    approvalStatuses: [],
    rollbackPlans: [],
    deploymentWindows: [],
    changeFreezes: [],
    regulatories: [],
    vendorMaintenances: [],
    releaseSizes: [],
  });

  useEffect(() => {
    type ApiRelease = ReleaseRow & {
      approvalStatus?: string | null;
      rollbackPlan?: string | null;
      deploymentWindow?: string | null;
      changeFreeze?: string | null;
      regulatory?: string | null;
      vendorMaintenance?: string | null;
      releaseSize?: string | null;
    };

    const uniq = (vals: (string | null | undefined)[]) =>
      [...new Set(vals.map((v) => (v ?? "").trim()).filter(Boolean))].sort();

    // Enum option lists only — Owner/Stakeholder are free-text against live User.name
    // (no client-side name list; see releaseListWhere name contains).
    return loadJsonEffect<ApiRelease[]>("/api/releases", (rows) => {
      setFilterOptions({
        statuses: uniq(rows.map((r) => r.status)),
        priorities: uniq(rows.map((r) => r.priority)),
        impacts: uniq(rows.map((r) => r.impact)),
        approvalStatuses: uniq(rows.map((r) => r.approvalStatus)),
        rollbackPlans: uniq(rows.map((r) => r.rollbackPlan)),
        deploymentWindows: uniq(rows.map((r) => r.deploymentWindow)),
        changeFreezes: uniq(rows.map((r) => r.changeFreeze)),
        regulatories: uniq(rows.map((r) => r.regulatory)),
        vendorMaintenances: uniq(rows.map((r) => r.vendorMaintenance)),
        releaseSizes: uniq(rows.map((r) => r.releaseSize)),
      });
    }, { label: "releases-filter-options" });
  }, []);

  useEffect(() => {
    return loadJsonEffect<{ byKey?: Record<string, { readiness: number; blockerCount: number }> }>(
      "/api/releases/readiness",
      (d) => setReadinessByKey(d.byKey ?? {}),
      { label: "releases-readiness" },
    );
  }, []);

  useEffect(() => {
    return loadJsonEffect<{ user: SessionUser }>(
      "/api/auth/me",
      (d) => setUser(d.user),
      { label: "auth-me" },
    );
  }, []);

  useEffect(() => {
    if (!attentionMode) {
      setAttentionItems([]);
      return;
    }
    return loadJsonEffect<{ items?: NeedsAttentionItem[] }>(
      `/api/needs-attention?period=month${filterQuery}`,
      (d) => {
        let items: NeedsAttentionItem[] = d.items ?? [];
        if (attentionStatusFilter) items = items.filter((i) => i.status === attentionStatusFilter);
        setAttentionItems(items);
      },
      { label: "needs-attention" },
    );
  }, [attentionMode, filterQuery, attentionStatusFilter]);

  const scopeLabel = useMemo(
    () => filterLabel(filters, departments, applications, environments),
    [filters, departments, applications, environments]
  );

  const unified = useMemo(() => {
    return (dbRows as ReleaseRow[]).map((r) => dbToUnified(r));
  }, [dbRows]);

  const { sortKey, sortDir } = readSortFromValues(
    {
      sort: filters.sort === "releaseId" ? "releaseCode" : filters.sort === "date" ? "endDate" : filters.sort,
      sortDir: filters.sortDir,
    },
    "releaseCode",
    "asc"
  );

  const sorted = useMemo(
    () =>
      sortRows(unified, sortKey, sortDir, {
        releaseCode: (r) => r.code,
        name: (r) => r.name,
        department: (r) => r.departmentName ?? r.group ?? "",
        application: (r) => r.applicationName ?? "",
        priority: (r) => r.priority ?? "",
        impact: (r) => r.impact ?? "",
        endDate: (r) => new Date(r.date).getTime(),
        status: (r) => r.status,
        conflictIds: (r) => r.conflictIds?.join(", ") ?? "",
        readinessPercent: (r) => readinessByKey[readinessKey(r.source, r.id)]?.readiness ?? 999,
        blockers: (r) => readinessByKey[readinessKey(r.source, r.id)]?.blockerCount ?? 0,
        cabDate: (r) => (r.cabDate ? new Date(r.cabDate as string).getTime() : 0),
        goLiveChecklistPercent: (r) => r.goLiveChecklistPercent ?? 0,
      }),
    [unified, sortKey, sortDir, readinessByKey]
  );

  const canEdit = user?.role === "editor" || user?.role === "admin";

  const { isColumnVisible, columnPicker, filterPicker, isFilterVisible, prefsLoaded } = useTablePagePreferences(
    "releases",
    RELEASE_COLUMNS,
    RELEASE_FILTER_FIELDS,
    {
      lockedKeys: ["releaseCode", "actions"],
      defaultHiddenFilters: RELEASE_DEFAULT_HIDDEN_FILTER_KEYS,
    }
  );

  const tablePending = useTablePageLoading(filtersLoading, prefsLoaded);

  const remove = async (id: string) => {
    if (!confirm("Delete this release?")) return;
    await safeFetchJson(`/api/releases/${id}`, { method: "DELETE", label: "release-delete" });
    refreshLookups();
  };

  const dbRowById = (id: string) => (dbRows as ReleaseRow[]).find((r) => r.id === id);

  const releaseCodes = useMemo(
    () => (dbRows as ReleaseRow[]).map((r) => r.releaseCode),
    [dbRows]
  );

  return (
    <div>
      <TopBar
        pageKey="releases"
        trailing={
          <div className="flex items-center gap-2">
            {canEdit && !attentionMode && (
              <button
                type="button"
                className={cn(taBtnPrimary, "text-sm")}
                onClick={() => {
                  setEditRow(null);
                  setFormPrefill(null);
                  setModalOpen(true);
                }}
              >
                <Plus className="mr-1 inline h-4 w-4" /> Add New Release
              </button>
            )}
            <PageDocumentation pageKey="releases" />
          </div>
        }
        title={attentionMode ? "Needs attention" : "Releases"}
        subtitle={
          attentionMode
            ? `${attentionItems.length} blocked or at-risk release${attentionItems.length === 1 ? "" : "s"}${hasRefinement ? ` · ${scopeLabel}` : ""}`
            : hasRefinement
              ? `${unified.length} releases · ${scopeLabel}`
              : `${unified.length} releases`
        }
        highlight
      />

      <ReleaseFiltersBar
        className="mb-4"
        showListFilters={!attentionMode}
        statusOptions={filterOptions.statuses}
        priorityOptions={filterOptions.priorities}
        impactOptions={filterOptions.impacts}
        options={filterOptions}
        manageFilters={!attentionMode ? filterPicker : undefined}
        isFilterVisible={isFilterVisible}
      >
        {attentionMode ? (
          <>
            <ProgressLink
              href="/releases"
              className="inline-flex h-9 items-center rounded-lg border border-gray-200 px-3 text-xs font-medium text-gray-600 hover:border-brand-300"
            >
              ← All releases
            </ProgressLink>
            <ProgressLink
              href={`/releases?attention=1${filterQuery}`}
              className={cn(
                "inline-flex h-9 items-center rounded-lg border px-3 text-xs font-medium transition-colors",
                !attentionStatusFilter ? "border-brand-500 bg-brand-500 text-white" : "border-gray-200 text-gray-600"
              )}
            >
              All stuck
            </ProgressLink>
            <ProgressLink
              href={`/releases?attention=1&status=Blocked${filterQuery}`}
              className={cn(
                "inline-flex h-9 items-center rounded-lg border px-3 text-xs font-medium transition-colors",
                attentionStatusFilter === "Blocked" ? "border-brand-500 bg-brand-500 text-white" : "border-gray-200 text-gray-600"
              )}
            >
              Blocked
            </ProgressLink>
            <ProgressLink
              href={`/releases?attention=1&status=At%20Risk${filterQuery}`}
              className={cn(
                "inline-flex h-9 items-center rounded-lg border px-3 text-xs font-medium transition-colors",
                attentionStatusFilter === "At Risk" ? "border-brand-500 bg-brand-500 text-white" : "border-gray-200 text-gray-600"
              )}
            >
              At risk
            </ProgressLink>
          </>
        ) : (
          <ProgressLink
            href={`/releases?attention=1${filterQuery}`}
            className="inline-flex h-9 items-center rounded-lg border border-amber-200 bg-amber-50 px-3 text-xs font-medium text-amber-800 hover:border-amber-300"
          >
            Needs attention
          </ProgressLink>
        )}
      </ReleaseFiltersBar>

      {attentionMode && (
        <NeedsAttentionPanel items={attentionItems} showViewAll={false} />
      )}

      {!attentionMode && tablePending && (
        <TableSkeleton columns={8} rows={10} />
      )}

      {!attentionMode && !tablePending && (
      <DataTable
        title="All Releases"
        icon={Package}
        toolbar={
          !attentionMode ? (
            <TablePageToolbar
              columnPicker={columnPicker}
              presets={RELEASE_TABLE_SORT_PRESETS}
              sortKey={sortKey}
              sortDir={sortDir}
              onSelectSort={setSort}
            />
          ) : undefined
        }
      >
        <table className={dataTableTableClass}>
          <thead>
            <DataTableHeadRow
              columns={RELEASE_COLUMNS}
              isColumnVisible={isColumnVisible}
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={toggleSort}
              extraHeaders={canEdit ? <th className={tableHeadCell} aria-label="Actions" /> : undefined}
            />
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={RELEASE_COLUMNS.filter((c) => isColumnVisible(c.key)).length + (canEdit ? 1 : 0)} className={`${tableCell} text-center text-gray-400 py-8`}>
                  No releases match the current filters.
                </td>
              </tr>
            ) : (
              sorted.map((r) => (
                <UnifiedRow
                  key={`${r.source}-${r.id}`}
                  row={r}
                  dbRow={dbRowById(r.id)}
                  canEdit={canEdit}
                  isColumnVisible={isColumnVisible}
                  onEdit={() => {
                    const db = dbRowById(r.id);
                    if (db) { setFormPrefill(null); setEditRow(db); setModalOpen(true); }
                  }}
                  onDelete={() => remove(r.id)}
                />
              ))
            )}
          </tbody>
        </table>
      </DataTable>
      )}

      <ReleaseFormModal
        open={modalOpen}
        initial={editRow ? {
          id: editRow.id,
          releaseCode: editRow.releaseCode,
          name: editRow.name,
          programProject: editRow.programProject ?? "",
          owner: editRow.owner,
          status: editRow.status,
          releaseDate: editRow.releaseDate,
          priority: editRow.priority,
          impact: editRow.impact,
          departmentId: editRow.departmentId,
          applicationIds: editRow.applications.map((a) => a.application.id),
          dependsOnReleaseIds: editRow.dependsOn.map((d) => d.dependsOnRelease.id),
          notes: "",
        } : formPrefill ?? undefined}
        existingReleaseCodes={releaseCodes}
        departments={departments.map((d) => ({ value: d.id, label: d.name }))}
        applications={applications.map((a) => ({ value: a.id, label: a.name }))}
        releases={(dbRows as ReleaseRow[]).map((r) => ({ value: r.id, label: r.releaseCode }))}
        onClose={() => { setModalOpen(false); setFormPrefill(null); }}
        onSaved={refreshLookups}
      />
    </div>
  );
}

function UnifiedRow({
  row,
  dbRow,
  canEdit,
  isColumnVisible,
  onEdit,
  onDelete,
}: {
  row: UnifiedRelease;
  dbRow?: ReleaseRow;
  canEdit: boolean;
  isColumnVisible: (key: string) => boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const programProject =
    dbRow?.programProject ?? row.programProject ?? "—";
  const priority = dbRow?.priority ?? row.priority ?? "—";
  const impact = dbRow?.impact ?? row.impact ?? "—";
  const department = row.departmentName ?? row.group ?? "—";
  const applications =
    dbRow?.applications.map((a) => a.application.name).join(", ") ||
    row.applicationName ||
    "—";
  const dependsOn =
    dbRow?.dependsOn.map((d) => d.dependsOnRelease.releaseCode).join(", ") ||
    row.dependsOnLabel ||
    "—";

  return (
    <tr className={cn(tableRow, "group")}>
      {isColumnVisible("releaseCode") && (
      <td className={`${tableCell} whitespace-nowrap`}>
        <ProgressLink href={row.href} className="font-mono text-xs text-brand-600 hover:underline">{row.code}</ProgressLink>
      </td>
      )}
      {isColumnVisible("name") && (
      <td className={`${tableCell} whitespace-nowrap`}>
        <ProgressLink href={row.href} className="hover:text-brand-600">{row.name}</ProgressLink>
      </td>
      )}
      {isColumnVisible("department") && <td className={`${tableCell} whitespace-nowrap`}>{department}</td>}
      {isColumnVisible("application") && <td className={`${tableCell} text-xs text-gray-600 max-w-[140px] truncate`}>{applications}</td>}
      {isColumnVisible("dependencies") && (
        <td className={`${tableCell} whitespace-nowrap text-xs text-gray-600`}>
          {row.dependencies ?? "NA"}
        </td>
      )}
      {isColumnVisible("releaseSize") && <td className={`${tableCell} whitespace-nowrap text-gray-600`}>{row.releaseSize ?? "—"}</td>}
      {isColumnVisible("impact") && <td className={`${tableCell} whitespace-nowrap`}>{impact}</td>}
      {isColumnVisible("priority") && <td className={`${tableCell} whitespace-nowrap`}>{priority}</td>}
      {isColumnVisible("cabDate") && <td className={`${tableCell} whitespace-nowrap text-gray-500`}>{row.cabDate ? formatDate(row.cabDate as string) : "—"}</td>}
      {isColumnVisible("startDate") && <td className={`${tableCell} whitespace-nowrap text-gray-500`}>{row.startDate ? formatDate(row.startDate as string) : "—"}</td>}
      {isColumnVisible("endDate") && <td className={`${tableCell} whitespace-nowrap text-gray-500`}>{formatDate(row.date)}</td>}
      {isColumnVisible("testEnvRequired") && <td className={`${tableCell} whitespace-nowrap text-gray-600`}>{row.testEnvRequired ?? "—"}</td>}
      {isColumnVisible("uatEnvRequired") && <td className={`${tableCell} whitespace-nowrap text-gray-600`}>{row.uatEnvRequired ?? "—"}</td>}
      {isColumnVisible("status") && <td className={`${tableCell} whitespace-nowrap`}><StatusBadge status={row.status as "Ready"} /></td>}
      {isColumnVisible("conflictFlag") && <td className={`${tableCell} whitespace-nowrap font-medium text-error-600`}>{row.conflictFlag ? "⚠️ CONFLICT" : "—"}</td>}
      {isColumnVisible("conflictIds") && (
        <td className={`${tableCell} whitespace-nowrap`}>
          {row.conflictIds?.length ? (
            <span className="font-mono text-xs">
              {row.conflictIds.map((conflictId, index) => (
                <span key={conflictId}>
                  {index > 0 && <span className="text-gray-400 dark:text-white/40">, </span>}
                  <ProgressLink
                    href={`/conflicts?conflictId=${encodeURIComponent(conflictId)}`}
                    className="text-brand-600 hover:underline dark:text-brand-400"
                  >
                    {conflictId}
                  </ProgressLink>
                </span>
              ))}
            </span>
          ) : (
            "—"
          )}
        </td>
      )}
      {isColumnVisible("notes") && <td className={`${tableCell} whitespace-nowrap text-xs text-gray-600 max-w-[200px] truncate`} title={row.notes ?? ""}>{row.notes ?? "—"}</td>}
      {isColumnVisible("readinessPercent") && <td className={`${tableCell} whitespace-nowrap font-medium`}>{row.readinessPercent !== null && row.readinessPercent !== undefined ? `${row.readinessPercent}%` : "—"}</td>}
      {isColumnVisible("blockers") && <td className={`${tableCell} whitespace-nowrap text-xs text-gray-600 max-w-[200px] truncate`} title={row.blockers ?? ""}>{row.blockers ?? "—"}</td>}
      {isColumnVisible("vendorMaintenance") && <td className={`${tableCell} whitespace-nowrap text-gray-600`}>{row.vendorMaintenance ?? "—"}</td>}
      {isColumnVisible("changeFreeze") && <td className={`${tableCell} whitespace-nowrap text-gray-600`}>{row.changeFreeze ?? "—"}</td>}
      {isColumnVisible("regulatory") && <td className={`${tableCell} whitespace-nowrap text-gray-600`}>{row.regulatory ?? "—"}</td>}
      {isColumnVisible("releaseOwnerId") && <td className={`${tableCell} whitespace-nowrap text-gray-600`}>{row.releaseOwnerId ?? "—"}</td>}
      {isColumnVisible("approvalStatus") && <td className={`${tableCell} whitespace-nowrap text-gray-600`}>{row.approvalStatus ?? "—"}</td>}
      {isColumnVisible("dependsOn") && <td className={`${tableCell} whitespace-nowrap text-xs text-gray-600 font-mono`}>{dependsOn}</td>}
      {isColumnVisible("rollbackPlan") && <td className={`${tableCell} whitespace-nowrap text-xs text-gray-600 max-w-[140px] truncate`}>{row.rollbackPlan ?? "—"}</td>}
      {isColumnVisible("goLiveChecklistPercent") && <td className={`${tableCell} whitespace-nowrap font-medium`}>{row.goLiveChecklistPercent !== null && row.goLiveChecklistPercent !== undefined ? `${row.goLiveChecklistPercent}%` : "—"}</td>}
      {isColumnVisible("stakeholderIds") && <td className={`${tableCell} whitespace-nowrap text-xs text-gray-600 max-w-[140px] truncate`} title={row.stakeholderIds ?? ""}>{row.stakeholderIds ?? "—"}</td>}
      {isColumnVisible("deploymentWindow") && <td className={`${tableCell} whitespace-nowrap text-gray-600`}>{row.deploymentWindow ?? "—"}</td>}
      {canEdit && (
        <td className={`${tableCell} whitespace-nowrap`}>
          {row.source === "database" && (
            <div className="flex gap-2 transition-opacity">
              <button type="button" onClick={onEdit} className="text-gray-500"><Pencil className="h-4 w-4" /></button>
              <button type="button" onClick={onDelete} className="text-error-500"><Trash2 className="h-4 w-4" /></button>
            </div>
          )}
        </td>
      )}
    </tr>
  );
}
