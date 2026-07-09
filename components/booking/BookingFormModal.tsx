"use client";

import { useEffect, useMemo, useState } from "react";
import { taBtnPrimary, taBtnSecondary, taInput } from "@/lib/styles";
import { cn } from "@/lib/utils";

export type BookingFormData = {
  applicationId: string;
  environmentId: string;
  releaseId: string;
  fromDate: string;
  toDate: string;
  purpose: string;
  team: string;
};

type Option = { value: string; label: string; departmentId?: string; applicationId?: string };

type ConflictRow = {
  applicationName?: string;
  bookedBy?: string;
  team?: string;
  environmentName?: string;
  fromDate?: string;
  toDate?: string;
  purpose?: string | null;
};

const EMPTY: BookingFormData = {
  applicationId: "",
  environmentId: "",
  releaseId: "",
  fromDate: new Date().toISOString().slice(0, 10),
  toDate: new Date().toISOString().slice(0, 10),
  purpose: "",
  team: "",
};

export function BookingFormModal({
  open,
  departments,
  applications,
  environments,
  releases,
  onClose,
  onSaved,
}: {
  open: boolean;
  departments: Option[];
  applications: Option[];
  environments: Option[];
  releases: Option[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<BookingFormData>(EMPTY);
  const [departmentId, setDepartmentId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conflicts, setConflicts] = useState<ConflictRow[]>([]);

  useEffect(() => {
    if (!open) return;
    setForm(EMPTY);
    setDepartmentId("");
    setError(null);
    setConflicts([]);
  }, [open]);

  const appOptions = useMemo(
    () =>
      departmentId
        ? applications.filter((a) => a.departmentId === departmentId)
        : applications,
    [applications, departmentId],
  );

  const envOptions = useMemo(
    () =>
      form.applicationId
        ? environments.filter((e) => e.applicationId === form.applicationId)
        : [],
    [environments, form.applicationId],
  );

  if (!open) return null;

  const saveWithConflicts = async () => {
    setError(null);
    setConflicts([]);
    if (!form.applicationId || !form.fromDate || !form.toDate) {
      setError("Application, from date, and to date are required.");
      return;
    }
    if (form.toDate < form.fromDate) {
      setError("To date must be on or after from date.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          applicationIds: [form.applicationId],
          environmentId: form.environmentId || undefined,
          releaseId: form.releaseId || undefined,
          fromDate: form.fromDate,
          toDate: form.toDate,
          purpose: form.purpose || undefined,
          team: form.team || undefined,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        conflicts?: ConflictRow[];
        bookings?: unknown[];
      };
      if (res.status === 409) {
        setConflicts(data.conflicts ?? []);
        setError(data.error || "Not available — overlapping booking on this application.");
        setSaving(false);
        return;
      }
      if (!res.ok) {
        setError(data.error || `Create failed (${res.status})`);
        setSaving(false);
        return;
      }
      onSaved();
      onClose();
    } catch {
      setError("Network error creating booking.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-theme-lg max-h-[90vh] overflow-y-auto dark:bg-[var(--card)]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-1 text-lg font-semibold text-gray-800 dark:text-white">New booking</h2>
        <p className="mb-4 text-xs text-gray-500 dark:text-white/55">
          Creates an environment booking for the selected application and date range. Overlaps with existing
          bookings are blocked and shown as conflicts.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-gray-500">Department</label>
            <select
              className={taInput}
              value={departmentId}
              onChange={(e) => {
                setDepartmentId(e.target.value);
                setForm((f) => ({ ...f, applicationId: "", environmentId: "" }));
              }}
            >
              <option value="">All departments</option>
              {departments.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Application *</label>
            <select
              className={taInput}
              value={form.applicationId}
              onChange={(e) =>
                setForm((f) => ({ ...f, applicationId: e.target.value, environmentId: "" }))
              }
            >
              <option value="">Select application…</option>
              {appOptions.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Environment</label>
            <select
              className={taInput}
              value={form.environmentId}
              onChange={(e) => setForm((f) => ({ ...f, environmentId: e.target.value }))}
              disabled={!form.applicationId}
            >
              <option value="">Default (first env)</option>
              {envOptions.map((e) => (
                <option key={e.value} value={e.value}>
                  {e.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Release (optional)</label>
            <select
              className={taInput}
              value={form.releaseId}
              onChange={(e) => setForm((f) => ({ ...f, releaseId: e.target.value }))}
            >
              <option value="">No linked release</option>
              {releases.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">From date *</label>
            <input
              type="date"
              className={taInput}
              value={form.fromDate}
              onChange={(e) => setForm((f) => ({ ...f, fromDate: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">To date *</label>
            <input
              type="date"
              className={taInput}
              value={form.toDate}
              onChange={(e) => setForm((f) => ({ ...f, toDate: e.target.value }))}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-gray-500">Team / booked for</label>
            <input
              className={taInput}
              value={form.team}
              onChange={(e) => setForm((f) => ({ ...f, team: e.target.value }))}
              placeholder="Defaults to application department"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-gray-500">Purpose / notes</label>
            <input
              className={taInput}
              value={form.purpose}
              onChange={(e) => setForm((f) => ({ ...f, purpose: e.target.value }))}
              placeholder="e.g. End-to-end test window"
            />
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200">
            {error}
          </div>
        )}
        {conflicts.length > 0 && (
          <ul className="mt-2 space-y-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
            {conflicts.map((c, i) => (
              <li key={i}>
                <strong>{c.applicationName}</strong>
                {c.environmentName ? ` · ${c.environmentName}` : ""} — booked by {c.bookedBy}
                {c.team ? ` (${c.team})` : ""}
                {c.fromDate && c.toDate
                  ? ` · ${String(c.fromDate).slice(0, 10)} → ${String(c.toDate).slice(0, 10)}`
                  : ""}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className={taBtnSecondary} onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button
            type="button"
            className={cn(taBtnPrimary, saving && "opacity-70")}
            onClick={saveWithConflicts}
            disabled={saving}
          >
            {saving ? "Creating…" : "Create booking"}
          </button>
        </div>
      </div>
    </div>
  );
}
