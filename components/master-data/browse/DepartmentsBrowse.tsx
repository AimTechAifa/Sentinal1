"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { DEFAULT_PAGE_SIZE, pageCount, paginateRows, type SortDir } from "@/lib/master-data/table-utils";
import { useTableFilters } from "@/hooks/useTableFilters";
import { DEPARTMENTS_FILTER_SCHEMA } from "@/lib/table-filters";
import { useTablePagePreferences } from "@/hooks/useTablePagePreferences";
import { useTablePageLoading } from "@/hooks/useTablePageLoading";
import { DEPARTMENT_COLUMNS, DEPARTMENT_FILTER_FIELDS } from "@/lib/table-page-columns";
import { TableToolbar } from "@/components/ui/data-table";
import {
  apiJson,
  BrowseToolbar,
  FormField,
  FormModal,
  inputClass,
  MasterDataEmptyState,
  MasterDataError,
  MasterDataLoading,
  MasterDataTableShell,
  RowActionsMenu,
  SortableTh,
  tdClass,
  thClass,
} from "@/components/master-data/shared";

export type DepartmentRow = {
  id: string;
  name: string;
  head: string;
  _count: { applications: number };
};

type FormState = { name: string; head: string };
const emptyForm: FormState = { name: "", head: "" };

export function DepartmentsBrowse() {
  const { values, setFilter, clearAll, hasActive, apiQuery } = useTableFilters(DEPARTMENTS_FILTER_SCHEMA);
  const [rows, setRows] = useState<DepartmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const search = values.q;
  const page = parseInt(values.page || "1", 10) || 1;
  const sortKey = (values.sort || "name") as "name" | "head";
  const sortDir = (values.sortDir || "asc") as SortDir;

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<DepartmentRow | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRows(await apiJson<DepartmentRow[]>(`/api/departments${apiQuery}`));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load departments");
    } finally {
      setLoading(false);
    }
  }, [apiQuery]);

  useEffect(() => {
    load();
  }, [load]);

  const totalPages = pageCount(rows.length, DEFAULT_PAGE_SIZE);
  const pageRows = paginateRows(rows, page, DEFAULT_PAGE_SIZE);

  const { isColumnVisible, columnPicker, prefsLoaded } = useTablePagePreferences(
    "departments",
    DEPARTMENT_COLUMNS,
    DEPARTMENT_FILTER_FIELDS,
    { lockedKeys: ["name", "actions"] }
  );

  const tablePending = useTablePageLoading(loading, prefsLoaded);

  const toggleSort = (key: "name" | "head") => {
    if (sortKey === key) setFilter("sortDir", sortDir === "asc" ? "desc" : "asc");
    else {
      setFilter("sort", key);
      setFilter("sortDir", "asc");
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (row: DepartmentRow) => {
    setEditing(row);
    setForm({ name: row.name, head: row.head });
    setFormError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setFormError("Name is required");
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      if (editing) {
        await apiJson(`/api/departments/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      } else {
        await apiJson("/api/departments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (row: DepartmentRow) => {
    if (!confirm(`Delete department "${row.name}"?`)) return;
    try {
      await apiJson(`/api/departments/${row.id}`, { method: "DELETE" });
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Delete failed");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-4">
        <TopBar title="Departments" subtitle={`${rows.length} organizational units`} />
        <button
          type="button"
          onClick={openCreate}
          className="shrink-0 rounded-lg bg-[#2548C9] px-5 py-2.5 text-[14px] font-semibold text-white hover:bg-[#1E3A9F]"
        >
          Add Department
        </button>
      </div>

      {error && <MasterDataError message={error} onRetry={load} />}

      <MasterDataTableShell toolbar={<TableToolbar>{columnPicker}</TableToolbar>}>
        <BrowseToolbar
          search={search}
          onSearchChange={(v) => setFilter("q", v)}
          page={page}
          totalPages={totalPages}
          totalRows={rows.length}
          pageSize={DEFAULT_PAGE_SIZE}
          onPageChange={(p) => setFilter("page", String(p))}
        />
        {tablePending ? (
          <MasterDataLoading columns={DEPARTMENT_COLUMNS.length} />
        ) : rows.length === 0 ? (
          <MasterDataEmptyState entityLabel="departments" addLabel="Add Department" onAdd={openCreate} />
        ) : (
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/50">
                {isColumnVisible("name") && (
                  <SortableTh label="Name" active={sortKey === "name"} dir={sortDir} onClick={() => toggleSort("name")} />
                )}
                {isColumnVisible("head") && (
                  <SortableTh label="Head" active={sortKey === "head"} dir={sortDir} onClick={() => toggleSort("head")} />
                )}
                {isColumnVisible("applicationCount") && <th className={thClass}>Application Count</th>}
                <th className={`${thClass} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pageRows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                  {isColumnVisible("name") && <td className={`${tdClass} font-semibold text-gray-900`}>{row.name}</td>}
                  {isColumnVisible("head") && <td className={tdClass}>{row.head || "—"}</td>}
                  {isColumnVisible("applicationCount") && <td className={tdClass}>{row._count?.applications ?? 0}</td>}
                  <td className={`${tdClass} text-right`}>
                    <RowActionsMenu onEdit={() => openEdit(row)} onDelete={() => handleDelete(row)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </MasterDataTableShell>

      <FormModal
        open={modalOpen}
        title={editing ? "Edit Department" : "Add Department"}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        submitting={submitting}
      >
        {formError && <p className="text-[13px] text-red-600">{formError}</p>}
        <FormField label="Name" required>
          <input className={inputClass} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        </FormField>
        <FormField label="Head">
          <input className={inputClass} value={form.head} onChange={(e) => setForm((f) => ({ ...f, head: e.target.value }))} />
        </FormField>
      </FormModal>
    </div>
  );
}
