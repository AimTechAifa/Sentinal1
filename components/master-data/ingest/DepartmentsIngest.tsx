"use client";

import { useCallback, useEffect, useState } from "react";
import { BulkImportWizard } from "@/components/master-data/BulkImportWizard";
import {
  apiJson,
  FormField,
  inputClass,
  MasterDataError,
  ViewAllLink,
} from "@/components/master-data/shared";
import {
  DEPARTMENT_IMPORT_FIELDS,
  runDepartmentImport,
  validateDepartmentImport,
} from "@/lib/master-data/bulk-import";
import type { DepartmentRow } from "@/components/master-data/browse/DepartmentsBrowse";

type FormState = { name: string; head: string };
const emptyForm: FormState = { name: "", head: "" };

export function DepartmentsIngest() {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [existingNames, setExistingNames] = useState<Set<string>>(new Set());

  const refreshExisting = useCallback(async () => {
    const rows = await apiJson<DepartmentRow[]>("/api/departments");
    setExistingNames(new Set(rows.map((r) => r.name.toLowerCase())));
  }, []);

  useEffect(() => {
    void refreshExisting();
  }, [refreshExisting]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setFormError("Name is required");
      return;
    }
    setSubmitting(true);
    setFormError(null);
    setSuccess(null);
    try {
      await apiJson("/api/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setSuccess(`Department "${form.name}" created.`);
      setForm(emptyForm);
      await refreshExisting();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[20px] font-bold text-gray-900">Add Departments</h2>
          <p className="text-[14px] text-gray-500 mt-1">Manually enter or bulk-import department records.</p>
        </div>
        <ViewAllLink href="/departments" label="View all Departments" />
      </div>

      <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4 max-w-lg">
        <h3 className="text-[16px] font-bold text-gray-900">Add New Department</h3>
        {formError && <MasterDataError message={formError} />}
        {success && <p className="text-[13px] text-emerald-700 font-medium">{success}</p>}
        <FormField label="Name" required>
          <input className={inputClass} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        </FormField>
        <FormField label="Head">
          <input className={inputClass} value={form.head} onChange={(e) => setForm((f) => ({ ...f, head: e.target.value }))} />
        </FormField>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-[#2548C9] px-5 py-2.5 text-[14px] font-semibold text-white hover:bg-[#1E3A9F] disabled:opacity-60"
        >
          {submitting ? "Saving…" : "Add Department"}
        </button>
      </form>

      <BulkImportWizard
        entityLabel="Departments"
        fields={DEPARTMENT_IMPORT_FIELDS}
        validateRows={(rows) => validateDepartmentImport(rows, existingNames)}
        runImport={async (rows) => {
          const result = await runDepartmentImport(rows);
          await refreshExisting();
          return result;
        }}
      />
    </div>
  );
}
