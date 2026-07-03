"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BulkImportWizard } from "@/components/master-data/BulkImportWizard";
import {
  apiJson,
  FormField,
  inputClass,
  MasterDataError,
  ViewAllLink,
} from "@/components/master-data/shared";
import {
  RISK_FACTOR_IMPORT_FIELDS,
  runRiskFactorImport,
  validateRiskFactorImport,
} from "@/lib/master-data/bulk-import";
import { RISK_FACTOR_WEIGHT_SUM } from "@/lib/risk-scoring/factors";

type RiskFactorRow = { id: string; factorName: string; weight: number; active: boolean };

type FormState = { category: string; factorName: string; weight: string; description: string };
const emptyForm: FormState = { category: "", factorName: "", weight: "", description: "" };

// The verified real-formula weight sum (0.992, not exactly 1.0 — see lib/risk-scoring/factors.ts).
// Bulk re-uploads of the full factor table are validated against this target with a small tolerance.
const WEIGHT_SUM_TOLERANCE = 0.01;

export function RiskFactorsIngest() {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [existingRows, setExistingRows] = useState<RiskFactorRow[]>([]);

  const refreshExisting = useCallback(async () => {
    const rows = await apiJson<RiskFactorRow[]>("/api/risk-factors");
    setExistingRows(rows);
  }, []);

  useEffect(() => {
    void refreshExisting();
  }, [refreshExisting]);

  const activeWeightSum = useMemo(
    () => existingRows.filter((r) => r.active).reduce((s, r) => s + r.weight, 0),
    [existingRows]
  );
  const existingNames = useMemo(
    () => new Set(existingRows.map((r) => r.factorName.toLowerCase())),
    [existingRows]
  );

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
    setSuccess(null);
    try {
      await apiJson("/api/risk-factors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: form.category, factorName: form.factorName, weight, description: form.description }),
      });
      setSuccess(`Risk factor "${form.factorName}" created.`);
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
          <h2 className="text-[20px] font-bold text-gray-900">Add Risk Factors</h2>
          <p className="text-[14px] text-gray-500 mt-1">
            Manually enter or bulk-import the weighted-scoring factor table.
          </p>
        </div>
        <ViewAllLink href="/risk-factors" label="View all Risk Factors" />
      </div>

      <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-[13px] text-blue-900 max-w-lg">
        Active factor weights currently sum to <strong>{activeWeightSum.toFixed(3)}</strong>. The verified target from
        the source formula is <strong>{RISK_FACTOR_WEIGHT_SUM.toFixed(3)}</strong> (not exactly 1.0 due to source
        rounding — confirmed against real data). Adding a single factor here will change this total; use{" "}
        <strong>Bulk Import</strong> below to re-upload the full table if you need it to land back on target.
      </div>

      <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4 max-w-lg">
        <h3 className="text-[16px] font-bold text-gray-900">Add New Risk Factor</h3>
        {formError && <MasterDataError message={formError} />}
        {success && <p className="text-[13px] text-emerald-700 font-medium">{success}</p>}
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
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-[#2548C9] px-5 py-2.5 text-[14px] font-semibold text-white hover:bg-[#1E3A9F] disabled:opacity-60"
        >
          {submitting ? "Saving…" : "Add Risk Factor"}
        </button>
      </form>

      <BulkImportWizard
        entityLabel="Risk Factors"
        fields={RISK_FACTOR_IMPORT_FIELDS}
        validateRows={(rows) => {
          const result = validateRiskFactorImport(rows, existingNames);
          const uploadedSum = result.valid.reduce((s, r) => s + r.weight, 0);
          const deviation = Math.abs(uploadedSum - RISK_FACTOR_WEIGHT_SUM);
          if (result.valid.length > 0 && deviation > WEIGHT_SUM_TOLERANCE) {
            // Block the whole batch — a full-table re-upload must land on the verified target.
            return {
              valid: [],
              issues: [
                ...result.issues,
                {
                  row: 0,
                  message: `Blocked: uploaded weights sum to ${uploadedSum.toFixed(3)}, which is more than ${WEIGHT_SUM_TOLERANCE} away from the verified target ${RISK_FACTOR_WEIGHT_SUM.toFixed(3)}. Fix weights and re-upload.`,
                },
              ],
            };
          }
          return result;
        }}
        runImport={async (rows) => {
          const result = await runRiskFactorImport(rows);
          await refreshExisting();
          return result;
        }}
      />
    </div>
  );
}
