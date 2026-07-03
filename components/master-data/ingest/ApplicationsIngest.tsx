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
  APPLICATION_IMPORT_FIELDS,
  runApplicationImport,
  validateApplicationImport,
} from "@/lib/master-data/bulk-import";

type DepartmentOption = { id: string; name: string };
type ApplicationRow = {
  id: string;
  name: string;
  departmentId: string;
};

type FormState = {
  name: string;
  departmentId: string;
  type: string;
  productOwner: string;
  techLead: string;
  support: string;
  criticality: string;
};

const emptyForm: FormState = {
  name: "",
  departmentId: "",
  type: "",
  productOwner: "",
  techLead: "",
  support: "",
  criticality: "Medium",
};

export function ApplicationsIngest() {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deptByName, setDeptByName] = useState<Map<string, string>>(new Map());
  const [existingKeys, setExistingKeys] = useState<Set<string>>(new Set());

  const refreshContext = useCallback(async () => {
    const [depts, apps] = await Promise.all([
      apiJson<DepartmentOption[]>("/api/departments"),
      apiJson<ApplicationRow[]>("/api/applications"),
    ]);
    setDepartments(depts);
    setDeptByName(new Map(depts.map((d) => [d.name.toLowerCase(), d.id])));
    setExistingKeys(new Set(apps.map((a) => `${a.departmentId}:${a.name.toLowerCase()}`)));
    if (!form.departmentId && depts[0]) {
      setForm((f) => ({ ...f, departmentId: depts[0].id }));
    }
  }, [form.departmentId]);

  useEffect(() => {
    void refreshContext();
  }, [refreshContext]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.departmentId) {
      setFormError("Name and department are required");
      return;
    }
    setSubmitting(true);
    setFormError(null);
    setSuccess(null);
    try {
      await apiJson("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setSuccess(`Application "${form.name}" created.`);
      setForm({ ...emptyForm, departmentId: departments[0]?.id ?? "" });
      await refreshContext();
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
          <h2 className="text-[20px] font-bold text-gray-900">Add Applications</h2>
          <p className="text-[14px] text-gray-500 mt-1">Manually enter or bulk-import application records.</p>
        </div>
        <ViewAllLink href="/applications" label="View all Applications" />
      </div>

      <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4 max-w-lg">
        <h3 className="text-[16px] font-bold text-gray-900">Add New Application</h3>
        {formError && <MasterDataError message={formError} />}
        {success && <p className="text-[13px] text-emerald-700 font-medium">{success}</p>}
        <FormField label="Name" required>
          <input className={inputClass} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        </FormField>
        <FormField label="Department" required>
          <select className={inputClass} value={form.departmentId} onChange={(e) => setForm((f) => ({ ...f, departmentId: e.target.value }))}>
            <option value="">Select department</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Type">
          <input className={inputClass} value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} />
        </FormField>
        <FormField label="Product Owner">
          <input className={inputClass} value={form.productOwner} onChange={(e) => setForm((f) => ({ ...f, productOwner: e.target.value }))} />
        </FormField>
        <FormField label="Tech Lead">
          <input className={inputClass} value={form.techLead} onChange={(e) => setForm((f) => ({ ...f, techLead: e.target.value }))} />
        </FormField>
        <FormField label="Support">
          <input className={inputClass} value={form.support} onChange={(e) => setForm((f) => ({ ...f, support: e.target.value }))} />
        </FormField>
        <FormField label="Criticality">
          <select className={inputClass} value={form.criticality} onChange={(e) => setForm((f) => ({ ...f, criticality: e.target.value }))}>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>
        </FormField>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-[#2548C9] px-5 py-2.5 text-[14px] font-semibold text-white hover:bg-[#1E3A9F] disabled:opacity-60"
        >
          {submitting ? "Saving…" : "Add Application"}
        </button>
      </form>

      <BulkImportWizard
        entityLabel="Applications"
        fields={APPLICATION_IMPORT_FIELDS}
        validateRows={(rows) => validateApplicationImport(rows, deptByName, existingKeys)}
        runImport={async (rows) => {
          const result = await runApplicationImport(rows);
          await refreshContext();
          return result;
        }}
      />
    </div>
  );
}
