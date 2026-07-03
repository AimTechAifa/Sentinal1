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
  USER_IMPORT_FIELDS,
  runUserImport,
  validateUserImport,
} from "@/lib/master-data/bulk-import";

type DepartmentOption = { id: string; name: string };
type UserRow = { id: string; email: string };

type FormState = {
  name: string;
  email: string;
  role: string;
  department: string;
  manager: string;
  accessLevel: string;
  status: string;
};

const emptyForm: FormState = {
  name: "",
  email: "",
  role: "Developer",
  department: "",
  manager: "",
  accessLevel: "Standard",
  status: "Active",
};

export function UsersIngest() {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [existingEmails, setExistingEmails] = useState<Set<string>>(new Set());

  const refreshContext = useCallback(async () => {
    const [users, depts] = await Promise.all([
      apiJson<UserRow[]>("/api/users"),
      apiJson<DepartmentOption[]>("/api/departments"),
    ]);
    setExistingEmails(new Set(users.map((u) => u.email.toLowerCase())));
    setDepartments(depts);
    if (!form.department && depts[0]) {
      setForm((f) => ({ ...f, department: depts[0].name }));
    }
  }, [form.department]);

  useEffect(() => {
    void refreshContext();
  }, [refreshContext]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      setFormError("Name and email are required");
      return;
    }
    setSubmitting(true);
    setFormError(null);
    setSuccess(null);
    try {
      await apiJson("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, manager: form.manager || null }),
      });
      setSuccess(`User "${form.name}" created.`);
      setForm({ ...emptyForm, department: departments[0]?.name ?? "" });
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
          <h2 className="text-[20px] font-bold text-gray-900">Add Users</h2>
          <p className="text-[14px] text-gray-500 mt-1">Manually enter or bulk-import user records.</p>
        </div>
        <ViewAllLink href="/users" label="View all Users" />
      </div>

      <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4 max-w-lg">
        <h3 className="text-[16px] font-bold text-gray-900">Add New User</h3>
        {formError && <MasterDataError message={formError} />}
        {success && <p className="text-[13px] text-emerald-700 font-medium">{success}</p>}
        <FormField label="Name" required>
          <input className={inputClass} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        </FormField>
        <FormField label="Email" required>
          <input type="email" className={inputClass} value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
        </FormField>
        <FormField label="Role">
          <input className={inputClass} value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} />
        </FormField>
        <FormField label="Department">
          <select className={inputClass} value={form.department} onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}>
            <option value="">Select department</option>
            {departments.map((d) => (
              <option key={d.id} value={d.name}>{d.name}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Manager">
          <input className={inputClass} value={form.manager} onChange={(e) => setForm((f) => ({ ...f, manager: e.target.value }))} />
        </FormField>
        <FormField label="Access Level">
          <select className={inputClass} value={form.accessLevel} onChange={(e) => setForm((f) => ({ ...f, accessLevel: e.target.value }))}>
            <option value="Standard">Standard</option>
            <option value="Elevated">Elevated</option>
            <option value="Admin">Admin</option>
          </select>
        </FormField>
        <FormField label="Status">
          <select className={inputClass} value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </FormField>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-[#2548C9] px-5 py-2.5 text-[14px] font-semibold text-white hover:bg-[#1E3A9F] disabled:opacity-60"
        >
          {submitting ? "Saving…" : "Add User"}
        </button>
      </form>

      <BulkImportWizard
        entityLabel="Users"
        fields={USER_IMPORT_FIELDS}
        validateRows={(rows) => validateUserImport(rows, existingEmails)}
        runImport={async (rows) => {
          const result = await runUserImport(rows);
          await refreshContext();
          return result;
        }}
      />
    </div>
  );
}
