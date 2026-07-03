"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { taBtnPrimary, taBtnSecondary, taInput } from "@/lib/styles";
import { generateReleaseId, normalizeProgramProject } from "@/lib/release-id";
import { cn } from "@/lib/utils";

export type ReleaseFormData = {
  id?: string;
  releaseCode: string;
  name: string;
  programProject: string;
  owner: string;
  status: string;
  releaseDate: string;
  priority: string;
  impact: string;
  departmentId: string;
  applicationIds: string[];
  dependsOnReleaseIds: string[];
  notes: string;
};

type Option = { value: string; label: string };

const STATUSES = ["Planned", "In Progress", "Blocked", "At Risk", "Complete", "Shipped", "Scheduled", "Ready"];
const LEVELS = ["High", "Medium", "Low"];

const EMPTY_FORM: ReleaseFormData = {
  releaseCode: "",
  name: "",
  programProject: "",
  owner: "",
  status: "Planned",
  releaseDate: new Date().toISOString().slice(0, 10),
  priority: "Medium",
  impact: "Medium",
  departmentId: "",
  applicationIds: [],
  dependsOnReleaseIds: [],
  notes: "",
};

export function ReleaseFormModal({
  open,
  initial,
  existingReleaseCodes,
  departments,
  applications,
  releases,
  onClose,
  onSaved,
}: {
  open: boolean;
  initial?: Partial<ReleaseFormData> | null;
  existingReleaseCodes: string[];
  departments: Option[];
  applications: Option[];
  releases: Option[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<ReleaseFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const isEdit = Boolean(initial?.id);

  useEffect(() => {
    if (!open) return;
    const next: ReleaseFormData = {
      ...EMPTY_FORM,
      releaseCode: initial?.releaseCode ?? generateReleaseId(existingReleaseCodes),
      name: initial?.name ?? "",
      programProject: initial?.programProject ?? "",
      owner: initial?.owner ?? "",
      status: initial?.status ?? "Planned",
      releaseDate: initial?.releaseDate?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
      priority: initial?.priority ?? "Medium",
      impact: initial?.impact ?? "Medium",
      departmentId: initial?.departmentId ?? "",
      applicationIds: initial?.applicationIds ?? [],
      dependsOnReleaseIds: initial?.dependsOnReleaseIds ?? [],
      notes: initial?.notes ?? "",
    };
    if (initial?.id) next.id = initial.id;
    setForm(next);
  }, [open, initial, existingReleaseCodes]);

  if (!open) return null;

  const regenerateId = () => {
    const codes = isEdit
      ? existingReleaseCodes.filter((c) => c !== initial?.releaseCode)
      : existingReleaseCodes;
    setForm((f) => ({ ...f, releaseCode: generateReleaseId(codes) }));
  };

  const save = async () => {
    setSaving(true);
    const payload = {
      ...form,
      programProject: normalizeProgramProject(form.programProject) ?? "N/A",
    };
    const res = await fetch(isEdit ? `/api/releases/${initial!.id}` : "/api/releases", {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (res.ok) {
      onSaved();
      onClose();
    }
  };

  const toggleMulti = (key: "applicationIds" | "dependsOnReleaseIds", id: string) => {
    setForm((f) => ({
      ...f,
      [key]: f[key].includes(id) ? f[key].filter((x) => x !== id) : [...f[key], id],
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-theme-lg p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-gray-800 mb-1">{isEdit ? "Edit release" : "New release"}</h2>
        <p className="text-xs text-gray-500 mb-4">Program / Project accepts N/A for hotfixes, infra, security, and independent releases.</p>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-gray-500">Release ID</label>
            <div className="mt-1 flex gap-2">
              <input
                className={cn(taInput, "font-mono text-sm", !isEdit && "bg-gray-50")}
                value={form.releaseCode}
                onChange={(e) => setForm({ ...form, releaseCode: e.target.value.toUpperCase() })}
                readOnly={!isEdit}
                placeholder="Auto-generated unique ID"
              />
              {!isEdit && (
                <button
                  type="button"
                  onClick={regenerateId}
                  className="shrink-0 rounded-lg border border-gray-200 px-3 text-gray-500 hover:bg-brand-50 hover:text-brand-600"
                  title="Generate new ID"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <Field label="Release Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
          <Field
            label="Program / Project"
            value={form.programProject}
            onChange={(v) => setForm({ ...form, programProject: v })}
            placeholder="N/A for hotfixes, infra, security…"
          />
          <Field label="Owner" value={form.owner} onChange={(v) => setForm({ ...form, owner: v })} />
          <div>
            <label className="text-xs font-medium text-gray-500">Department</label>
            <select className={taInput} value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })}>
              <option value="">Select department…</option>
              {departments.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Status</label>
            <select className={taInput} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Release date</label>
            <input type="date" className={taInput} value={form.releaseDate} onChange={(e) => setForm({ ...form, releaseDate: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Priority</label>
            <select className={taInput} value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
              {LEVELS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Impact</label>
            <select className={taInput} value={form.impact} onChange={(e) => setForm({ ...form, impact: e.target.value })}>
              {LEVELS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>

        <div className="mt-4">
          <label className="text-xs font-medium text-gray-500">Application/s</label>
          <div className="flex flex-wrap gap-2 mt-1.5">
            {applications.map((a) => (
              <button
                key={a.value}
                type="button"
                onClick={() => toggleMulti("applicationIds", a.value)}
                className={cn(
                  "rounded-lg px-2.5 py-1 text-xs border",
                  form.applicationIds.includes(a.value) ? "bg-brand-500 text-white border-brand-500" : "border-gray-200 text-gray-600"
                )}
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <label className="text-xs font-medium text-gray-500">Dependent on release</label>
          <div className="flex flex-wrap gap-2 mt-1.5">
            {releases.filter((r) => r.value !== initial?.id).map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => toggleMulti("dependsOnReleaseIds", r.value)}
                className={cn(
                  "rounded-lg px-2.5 py-1 text-xs border",
                  form.dependsOnReleaseIds.includes(r.value) ? "bg-brand-400 text-white border-brand-400" : "border-gray-200 text-gray-600"
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <label className="text-xs font-medium text-gray-500">Notes (optional)</label>
          <textarea className={`${taInput} min-h-[72px] mt-1`} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className={taBtnSecondary} onClick={onClose}>Cancel</button>
          <button
            type="button"
            className={taBtnPrimary}
            onClick={save}
            disabled={saving || !form.releaseCode || !form.name || !form.departmentId}
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="text-xs font-medium text-gray-500">{label}</label>
      <input className={taInput} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
