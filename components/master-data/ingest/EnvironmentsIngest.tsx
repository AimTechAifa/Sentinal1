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
  ENVIRONMENT_IMPORT_FIELDS,
  runEnvironmentImport,
  validateEnvironmentImport,
} from "@/lib/master-data/bulk-import";

type ApplicationOption = { id: string; name: string };
type EnvironmentRow = { id: string; name: string; applicationId: string };

type FormState = {
  applicationId: string;
  name: string;
  type: string;
  owner: string;
  status: string;
};

const emptyForm: FormState = {
  applicationId: "",
  name: "",
  type: "",
  owner: "",
  status: "Available",
};

export function EnvironmentsIngest() {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [applications, setApplications] = useState<ApplicationOption[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [appByName, setAppByName] = useState<Map<string, string>>(new Map());
  const [existingKeys, setExistingKeys] = useState<Set<string>>(new Set());

  const refreshContext = useCallback(async () => {
    const [apps, envs] = await Promise.all([
      apiJson<ApplicationOption[]>("/api/applications"),
      apiJson<EnvironmentRow[]>("/api/environments"),
    ]);
    setApplications(apps);
    setAppByName(new Map(apps.map((a) => [a.name.toLowerCase(), a.id])));
    setExistingKeys(new Set(envs.map((e) => `${e.applicationId}:${e.name.toLowerCase()}`)));
    if (!form.applicationId && apps[0]) {
      setForm((f) => ({ ...f, applicationId: apps[0].id }));
    }
  }, [form.applicationId]);

  useEffect(() => {
    void refreshContext();
  }, [refreshContext]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.applicationId) {
      setFormError("Application and name are required");
      return;
    }
    setSubmitting(true);
    setFormError(null);
    setSuccess(null);
    try {
      await apiJson("/api/environments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setSuccess(`Environment "${form.name}" created.`);
      setForm({ ...emptyForm, applicationId: applications[0]?.id ?? "" });
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
          <h2 className="text-[20px] font-bold text-gray-900">Add Environments</h2>
          <p className="text-[14px] text-gray-500 mt-1">
            Manually enter or bulk-import environment records. Browse and edit existing environments from Applications.
          </p>
        </div>
        <ViewAllLink href="/applications" label="View all Applications" />
      </div>

      <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4 max-w-lg">
        <h3 className="text-[16px] font-bold text-gray-900">Add New Environment</h3>
        {formError && <MasterDataError message={formError} />}
        {success && <p className="text-[13px] text-emerald-700 font-medium">{success}</p>}
        <FormField label="Application" required>
          <select
            className={inputClass}
            value={form.applicationId}
            onChange={(e) => setForm((f) => ({ ...f, applicationId: e.target.value }))}
          >
            <option value="">Select application</option>
            {applications.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Name" required>
          <input className={inputClass} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        </FormField>
        <FormField label="Type" required>
          <input className={inputClass} value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} />
        </FormField>
        <FormField label="Owner">
          <input className={inputClass} value={form.owner} onChange={(e) => setForm((f) => ({ ...f, owner: e.target.value }))} />
        </FormField>
        <FormField label="Status">
          <select className={inputClass} value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
            <option value="Available">Available</option>
            <option value="Active">Active</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Unavailable">Unavailable</option>
          </select>
        </FormField>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-[#2548C9] px-5 py-2.5 text-[14px] font-semibold text-white hover:bg-[#1E3A9F] disabled:opacity-60"
        >
          {submitting ? "Saving…" : "Add Environment"}
        </button>
      </form>

      <BulkImportWizard
        entityLabel="Environments"
        fields={ENVIRONMENT_IMPORT_FIELDS}
        validateRows={(rows) => validateEnvironmentImport(rows, appByName, existingKeys)}
        runImport={async (rows) => {
          const result = await runEnvironmentImport(rows);
          await refreshContext();
          return result;
        }}
      />
    </div>
  );
}
