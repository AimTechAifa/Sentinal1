"use client";

import { useCallback, useEffect, useState } from "react";
import { Upload, Plus, Trash2, Save } from "lucide-react";
import { DataTable, tableCell, tableHeadRow, tableRow } from "@/components/ui/data-table";
import { cn, formatDate } from "@/lib/utils";
import { taBtnPrimary, taBtnSecondary } from "@/lib/styles";

type Column<T> = {
  key: string;
  label: string;
  type?: "text" | "select" | "date";
  options?: { value: string; label: string }[];
  display?: (row: T) => string;
};

function cellValue<T>(row: T, col: Column<T>): string {
  if (col.display) return col.display(row);
  const raw = (row as Record<string, unknown>)[col.key];
  if (raw == null) return "";
  if (col.type === "date" && typeof raw === "string") return formatDate(raw);
  return String(raw);
}

function editValue<T>(row: Partial<T>, col: Column<T>): string {
  const raw = (row as Record<string, unknown>)[col.key];
  if (raw == null) return "";
  if (col.type === "date" && typeof raw === "string") return raw.slice(0, 10);
  return String(raw);
}

export function ReferenceDataTable<T extends { id: string }>({
  title,
  subtitle,
  columns,
  rows,
  onRefresh,
  createEmpty,
  apiPath,
  importEntity,
  canEdit,
}: {
  title: string;
  subtitle: string;
  columns: Column<T>[];
  rows: T[];
  onRefresh: () => void;
  createEmpty: () => Partial<T>;
  apiPath: string;
  importEntity: string;
  canEdit: boolean;
}) {
  const [draft, setDraft] = useState<Partial<T> | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRow, setEditRow] = useState<Partial<T>>({});

  const saveNew = async () => {
    if (!draft) return;
    await fetch(apiPath, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(draft) });
    setDraft(null);
    onRefresh();
  };

  const saveEdit = async (id: string) => {
    await fetch(`${apiPath}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editRow),
    });
    setEditingId(null);
    onRefresh();
  };

  const remove = async (id: string) => {
    await fetch(`${apiPath}/${id}`, { method: "DELETE" });
    onRefresh();
  };

  const uploadCsv = async (file: File) => {
    const form = new FormData();
    form.append("file", file);
    await fetch(`/api/import/${importEntity}`, { method: "POST", body: form });
    onRefresh();
  };

  const renderCell = (col: Column<T>, row: Partial<T>, onChange: (k: string, v: string) => void) => {
    const val = editValue(row, col);
    if (col.type === "select" && col.options) {
      return (
        <select
          className="w-full rounded-lg border border-gray-200 px-2 py-1 text-xs"
          value={val}
          disabled={!canEdit}
          onChange={(e) => onChange(col.key, e.target.value)}
        >
          <option value="">Select…</option>
          {col.options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      );
    }
    if (col.type === "date") {
      return (
        <input
          type="date"
          className="w-full rounded-lg border border-gray-200 px-2 py-1 text-xs"
          value={val}
          disabled={!canEdit}
          onChange={(e) => onChange(col.key, e.target.value)}
        />
      );
    }
    return (
      <input
        className="w-full rounded-lg border border-gray-200 px-2 py-1 text-xs"
        value={val}
        disabled={!canEdit}
        onChange={(e) => onChange(col.key, e.target.value)}
      />
    );
  };

  const startEdit = (row: T) => {
    setEditingId(row.id);
    const copy: Record<string, unknown> = { ...row };
    columns.forEach((c) => {
      if (c.type === "date" && typeof copy[c.key] === "string") {
        copy[c.key] = (copy[c.key] as string).slice(0, 10);
      }
    });
    setEditRow(copy as Partial<T>);
  };

  return (
    <DataTable
      title={title}
      subtitle={subtitle}
      action={
        canEdit ? (
          <div className="flex gap-2">
            <label className={cn(taBtnSecondary, "cursor-pointer text-xs py-1.5 px-2.5")}>
              <Upload className="h-3.5 w-3.5 inline mr-1" /> CSV
              <input type="file" accept=".csv" className="hidden" onChange={(e) => e.target.files?.[0] && uploadCsv(e.target.files[0])} />
            </label>
            <button type="button" className={cn(taBtnPrimary, "text-xs py-1.5 px-2.5")} onClick={() => setDraft(createEmpty())}>
              <Plus className="h-3.5 w-3.5 inline mr-1" /> Add
            </button>
          </div>
        ) : undefined
      }
    >
      <table className="w-full text-sm">
        <thead>
          <tr className={tableHeadRow}>
            {columns.map((c) => (
              <th key={c.key} className={cn(tableCell, "text-left font-medium")}>{c.label}</th>
            ))}
            {canEdit && <th className={cn(tableCell, "text-left font-medium")} />}
          </tr>
        </thead>
        <tbody>
          {draft && (
            <tr className={cn(tableRow, "bg-brand-50/40")}>
              {columns.map((c) => (
                <td key={c.key} className={tableCell}>
                  {renderCell(c, draft, (k, v) => setDraft({ ...draft, [k]: v }))}
                </td>
              ))}
              <td className={tableCell}>
                <button type="button" onClick={saveNew} className="text-brand-600 text-xs font-medium"><Save className="h-4 w-4" /></button>
              </td>
            </tr>
          )}
          {rows.map((row) => (
            <tr key={row.id} className={tableRow}>
              {columns.map((c) => (
                <td key={c.key} className={tableCell}>
                  {editingId === row.id
                    ? renderCell(c, editRow, (k, v) => setEditRow({ ...editRow, [k]: v }))
                    : cellValue(row, c)}
                </td>
              ))}
              {canEdit && (
                <td className={tableCell}>
                  <div className="flex gap-2">
                    {editingId === row.id ? (
                      <button type="button" onClick={() => saveEdit(row.id)} className="text-brand-600"><Save className="h-4 w-4" /></button>
                    ) : (
                      <button type="button" onClick={() => startEdit(row)} className="text-xs text-gray-500">Edit</button>
                    )}
                    <button type="button" onClick={() => remove(row.id)} className="text-error-500"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </DataTable>
  );
}

export function useReferenceData<T>(url: string) {
  const [rows, setRows] = useState<T[]>([]);
  const refresh = useCallback(() => {
    fetch(url).then((r) => r.json()).then(setRows);
  }, [url]);
  useEffect(() => { refresh(); }, [refresh]);
  return { rows, refresh };
}
