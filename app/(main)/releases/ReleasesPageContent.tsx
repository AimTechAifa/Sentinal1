"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, Pencil, Trash2, Package } from "lucide-react";
import { ProgressLink } from "@/components/layout/NavigationProgress";
import { TopBar } from "@/components/layout/TopBar";
import { StatusBadge } from "@/components/badges/StatusBadge";
import { NeedsAttentionPanel } from "@/components/dashboard/NeedsAttentionPanel";
import { ReleaseFormModal, type ReleaseFormData } from "@/components/releases/ReleaseFormModal";
import { PageDocumentation } from "@/components/help/PageDocumentation";
import { ReleaseFiltersBar } from "@/components/releases/ReleaseFiltersBar";
import { ColumnPicker } from "@/components/filters/ColumnPicker";
import { useColumnPreferences } from "@/hooks/useColumnPreferences";
import { RELEASE_COLUMNS } from "@/lib/table-page-columns";
import { DataTable, tableCell, tableHeadRow, tableRow } from "@/components/ui/data-table";
import { TableSkeleton } from "@/components/ui/TableSkeleton";
import { useReleaseFilters } from "@/context/ReleaseFiltersContext";
import { useTablePageLoading } from "@/hooks/useTablePageLoading";
import { filterLabel } from "@/lib/release-filters";
import { isNeedsAttentionStatus, type NeedsAttentionItem } from "@/lib/needs-attention";
import {
  dbToUnified,
  mergeReleases,
  type UnifiedRelease,
} from "@/lib/unified-releases";
import { formatDate, cn } from "@/lib/utils";
import { readinessKey } from "@/lib/release-readiness-batch";
import { taBtnPrimary } from "@/lib/styles";
import type { SessionUser } from "@/lib/auth/roles";



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
};

type SortMode = "releaseId" | "date" | "readiness" | "blockers";

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
  const [filterOptions, setFilterOptions] = useState<{ statuses: string[]; priorities: string[]; impacts: string[] }>({
    statuses: [],
    priorities: [],
    impacts: [],
  });

  const sortMode = (filters.sort || "releaseId") as SortMode;

  useEffect(() => {
    fetch("/api/releases")
      .then((r) => (r.ok ? r.json() : []))
      .then((rows: ReleaseRow[]) => {
        setFilterOptions({
          statuses: [...new Set(rows.map((r) => r.status))].sort(),
          priorities: [...new Set(rows.map((r) => r.priority))].sort(),
          impacts: [...new Set(rows.map((r) => r.impact))].sort(),
        });
      });
  }, []);

  useEffect(() => {
    fetch("/api/releases/readiness")
      .then((r) => (r.ok ? r.json() : { byKey: {} }))
      .then((d) => setReadinessByKey(d.byKey ?? {}));
  }, []);



  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((d) => setUser(d.user));
  }, []);

  useEffect(() => {
    if (!attentionMode) {
      setAttentionItems([]);
      return;
    }
    fetch(`/api/needs-attention?period=month${filterQuery}`)
      .then((r) => r.json())
      .then((d) => {
        let items: NeedsAttentionItem[] = d.items ?? [];
        if (attentionStatusFilter) items = items.filter((i) => i.status === attentionStatusFilter);
        setAttentionItems(items);
      });
  }, [attentionMode, filterQuery, attentionStatusFilter]);

  const scopeLabel = useMemo(
    () => filterLabel(filters, departments, applications, environments),
    [filters, departments, applications, environments]
  );

  const unified = useMemo(() => {
    const db = (dbRows as ReleaseRow[]).map((r) => dbToUnified(r));
    if (attentionMode) return db.filter((r) => isNeedsAttentionStatus(r.status));
    return db;
  }, [dbRows, attentionMode]);

  const sorted = useMemo(() => {
    const list = [...unified];
    if (sortMode === "releaseId") {
      return list.sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
    }
    if (sortMode === "readiness") {
      return list.sort((a, b) => {
        const ra = readinessByKey[readinessKey(a.source, a.id)]?.readiness ?? 999;
        const rb = readinessByKey[readinessKey(b.source, b.id)]?.readiness ?? 999;
        return ra - rb;
      });
    }
    if (sortMode === "blockers") {
      return list.sort((a, b) => {
        const ba = readinessByKey[readinessKey(a.source, a.id)]?.blockerCount ?? 0;
        const bb = readinessByKey[readinessKey(b.source, b.id)]?.blockerCount ?? 0;
        return bb - ba;
      });
    }
    return list;
  }, [unified, sortMode, readinessByKey]);

  const canEdit = user?.role === "editor" || user?.role === "admin";

  const {
    isColumnVisible,
    hideableColumns,
    hiddenColumns,
    toggleColumn,
    saveNow,
    loaded: columnsLoaded,
  } = useColumnPreferences("releases", RELEASE_COLUMNS, { lockedKeys: ["releaseCode", "actions"] });

  const tablePending = useTablePageLoading(filtersLoading, columnsLoaded);

  const columnPicker = (
    <ColumnPicker
      hideableColumns={hideableColumns}
      hiddenColumns={hiddenColumns}
      toggleColumn={toggleColumn}
      saveNow={saveNow}
      loaded={columnsLoaded}
    />
  );

  const remove = async (id: string) => {
    if (!confirm("Delete this release?")) return;
    await fetch(`/api/releases/${id}`, { method: "DELETE" });
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
        trailing={<PageDocumentation pageKey="releases" />}
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

      <div className="flex flex-wrap gap-2 mb-3">
        {attentionMode ? (
          <>
            <ProgressLink
              href="/releases"
              className="rounded-lg px-3 py-1.5 text-xs font-medium border border-gray-200 text-gray-600 hover:border-brand-300"
            >
              ← All releases
            </ProgressLink>
            <ProgressLink
              href={`/releases?attention=1${filterQuery}`}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium border transition-colors",
                !attentionStatusFilter ? "bg-brand-500 text-white border-brand-500" : "border-gray-200 text-gray-600"
              )}
            >
              All stuck
            </ProgressLink>
            <ProgressLink
              href={`/releases?attention=1&status=Blocked${filterQuery}`}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium border transition-colors",
                attentionStatusFilter === "Blocked" ? "bg-brand-500 text-white border-brand-500" : "border-gray-200 text-gray-600"
              )}
            >
              Blocked
            </ProgressLink>
            <ProgressLink
              href={`/releases?attention=1&status=At%20Risk${filterQuery}`}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium border transition-colors",
                attentionStatusFilter === "At Risk" ? "bg-brand-500 text-white border-brand-500" : "border-gray-200 text-gray-600"
              )}
            >
              At risk
            </ProgressLink>
          </>
        ) : (
          <>
            <ProgressLink
              href={`/releases?attention=1${filterQuery}`}
              className="rounded-lg px-3 py-1.5 text-xs font-medium border border-amber-200 bg-amber-50 text-amber-800 hover:border-amber-300"
            >
              Needs attention
            </ProgressLink>
          </>
        )}
      </div>

      <ReleaseFiltersBar
        className="mb-4"
        showListFilters={!attentionMode}
        statusOptions={filterOptions.statuses}
        priorityOptions={filterOptions.priorities}
        impactOptions={filterOptions.impacts}
        trailing={!attentionMode ? columnPicker : undefined}
      />

      {!attentionMode && (
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="text-xs text-gray-500 self-center mr-1">Sort by</span>
          {(
            [
              { id: "releaseId", label: "Release ID" },
              { id: "date", label: "Target date" },
              { id: "readiness", label: "Readiness ↑" },
              { id: "blockers", label: "Blockers" },
            ] as { id: SortMode; label: string }[]
          ).map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSort(s.id, s.id === "blockers" ? "desc" : "asc")}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium border transition-colors",
                sortMode === s.id
                  ? "bg-brand-500 text-white border-brand-500"
                  : "border-gray-200 text-gray-600 hover:border-brand-300"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}

      {attentionMode && (
        <NeedsAttentionPanel items={attentionItems} showViewAll={false} />
      )}

      {!attentionMode && tablePending && (
        <TableSkeleton columns={8} rows={10} />
      )}

      {!attentionMode && !tablePending && (
      <DataTable
        title="All Releases"
        subtitle="Manage releases in the central database"
        icon={Package}
        action={
          canEdit ? (
            <button type="button" className={cn(taBtnPrimary, "text-xs py-1.5 px-2.5")} onClick={() => { setEditRow(null); setFormPrefill(null); setModalOpen(true); }}>
              <Plus className="h-3.5 w-3.5 inline mr-1" /> New release (DB)
            </button>
          ) : undefined
        }
      >
        <table className="w-full text-sm">
          <thead className={tableHeadRow}>
            <tr>
              {RELEASE_COLUMNS.filter((c) => isColumnVisible(c.key)).map((c) => (
                <th key={c.key} className={`${tableCell} text-left font-medium whitespace-nowrap`}>{c.label}</th>
              ))}
              {canEdit && <th className={`${tableCell} text-left font-medium`} />}
            </tr>
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
