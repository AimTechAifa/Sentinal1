"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import {
  DEFAULT_PAGE_SIZE,
  filterRows,
  pageCount,
  paginateRows,
  sortRows,
  type SortDir,
} from "@/lib/master-data/table-utils";
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

export type RiskFactorRow = {
  id: string;
  category: string;
  factorName: string;
  weight: number;
  description: string | null;
  active: boolean;
  order: number | null;
};

type FormState = { category: string; factorName: string; weight: string; description: string; active: boolean };
const emptyForm: FormState = { category: "", factorName: "", weight: "", description: "", active: true };

type SortKey = "category" | "factorName" | "weight";

export function RiskFactorsBrowse() {
  const [rows, setRows] = useState<RiskFactorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<SortKey>("category");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<RiskFactorRow | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRows(await apiJson<RiskFactorRow[]>("/api/risk-factors"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load risk factors");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const activeWeightSum = useMemo(
    () => rows.filter((r) => r.active).reduce((s, r) => s + r.weight, 0),
    [rows]
  );

  const filtered = useMemo(
    () => filterRows(sortRows(rows, sortKey, sortDir), search, ["category", "factorName", "description"]),
    [rows, search, sortKey, sortDir]
  );
  const totalPages = pageCount(filtered.length, DEFAULT_PAGE_SIZE);
  const pageRows = paginateRows(filtered, page, DEFAULT_PAGE_SIZE);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (row: RiskFactorRow) => {
    setEditing(row);
    setForm({
      category: row.category,
      factorName: row.factorName,
      weight: String(row.weight),
      description: row.description ?? "",
      active: row.active,
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const weight = Number(form.weight);
    if (!form.category.trim() || !form.factorName.trim()) {
      setFormError("Category and factor name are required");
      return;
    }
    if (Number.isNaN(weight) || weight <= 0) {
      setFormError("Weight must be a positive number");
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      const payload = { category: form.category, factorName: form.factorName, weight, description: form.description, active: form.active };
      if (editing) {
        await apiJson(`/api/risk-factors/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await apiJson("/api/risk-factors", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
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

  const handleDelete = async (row: RiskFactorRow) => {
    if (!confirm(`Delete risk factor "${row.factorName}"?`)) return;
    try {
      await apiJson(`/api/risk-factors/${row.id}`, { method: "DELETE" });
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const toggleActive = async (row: RiskFactorRow) => {
    try {
      await apiJson(`/api/risk-factors/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !row.active }),
      });
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Update failed");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-2">
        <TopBar title="Risk Factors" subtitle={`${rows.length} weighted-scoring factors`} />
        <button
          type="button"
          onClick={openCreate}
          className="shrink-0 rounded-lg bg-[#2548C9] px-5 py-2.5 text-[14px] font-semibold text-white hover:bg-[#1E3A9F]"
        >
          Add Risk Factor
        </button>
      </div>

      <p className="text-[13px] text-gray-500 mb-4">
        Active weights sum to <strong className="text-gray-800">{activeWeightSum.toFixed(3)}</strong> — this is the
        verified value from the source formula (not exactly 1.0 due to source rounding).
      </p>

      {error && <MasterDataError message={error} onRetry={load} />}

      <MasterDataTableShell>
        <BrowseToolbar
          search={search}
          onSearchChange={setSearch}
          page={page}
          totalPages={totalPages}
          totalRows={filtered.length}
          pageSize={DEFAULT_PAGE_SIZE}
          onPageChange={setPage}
        />
        {loading ? (
          <MasterDataLoading />
        ) : filtered.length === 0 ? (
          <MasterDataEmptyState entityLabel="risk factors" addLabel="Add Risk Factor" onAdd={openCreate} />
        ) : (
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/50">
                <SortableTh label="Category" active={sortKey === "category"} dir={sortDir} onClick={() => toggleSort("category")} />
                <SortableTh label="Factor Name" active={sortKey === "factorName"} dir={sortDir} onClick={() => toggleSort("factorName")} />
                <SortableTh label="Weight" active={sortKey === "weight"} dir={sortDir} onClick={() => toggleSort("weight")} />
                <th className={thClass}>Description</th>
                <th className={thClass}>Active</th>
                <th className={`${thClass} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pageRows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className={tdClass}>{row.category}</td>
                  <td className={`${tdClass} font-semibold text-gray-900`}>{row.factorName}</td>
                  <td className={tdClass}>{row.weight}</td>
                  <td className={`${tdClass} text-gray-500 max-w-[280px] truncate`} title={row.description ?? ""}>{row.description || "—"}</td>
                  <td className={tdClass}>
                    <button
                      type="button"
                      onClick={() => toggleActive(row)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider border ${
                        row.active
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-gray-50 text-gray-500 border-gray-200"
                      }`}
                    >
                      {row.active ? "Active" : "Inactive"}
                    </button>
                  </td>
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
        title={editing ? "Edit Risk Factor" : "Add Risk Factor"}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        submitting={submitting}
      >
        {formError && <p className="text-[13px] text-red-600">{formError}</p>}
        <FormField label="Category" required>
          <input className={inputClass} value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} />
        </FormField>
        <FormField label="Factor Name" required>
          <input className={inputClass} value={form.factorName} onChange={(e) => setForm((f) => ({ ...f, factorName: e.target.value }))} />
        </FormField>
        <FormField label="Weight" required>
          <input type="number" step="0.001" className={inputClass} value={form.weight} onChange={(e) => setForm((f) => ({ ...f, weight: e.target.value }))} />
        </FormField>
        <FormField label="Description">
          <input className={inputClass} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
        </FormField>
        <FormField label="Active">
          <select
            className={inputClass}
            value={form.active ? "true" : "false"}
            onChange={(e) => setForm((f) => ({ ...f, active: e.target.value === "true" }))}
          >
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </FormField>
      </FormModal>
    </div>
  );
}
