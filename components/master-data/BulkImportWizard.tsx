"use client";

import { useMemo, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { applyColumnMapping, parseUploadFile } from "@/lib/master-data/parse-upload";
import type { ImportFieldDef, ImportRowIssue, ImportSummary, ValidatedImport } from "@/lib/master-data/bulk-import";
import { FormField, inputClass } from "./ui";

type Step = "upload" | "map" | "validate" | "done";

export function BulkImportWizard<T extends Record<string, unknown>>({
  entityLabel,
  fields,
  validateRows,
  runImport,
}: {
  entityLabel: string;
  fields: ImportFieldDef[];
  validateRows: (rows: Record<string, string>[]) => ValidatedImport<T>;
  runImport: (rows: T[]) => Promise<ImportSummary>;
}) {
  const [step, setStep] = useState<Step>("upload");
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [issues, setIssues] = useState<ImportRowIssue[]>([]);
  const [validRows, setValidRows] = useState<T[]>([]);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const autoMapping = useMemo(() => {
    const m: Record<string, string> = {};
    for (const f of fields) {
      const match = headers.find(
        (h) =>
          h.toLowerCase().replace(/\s+/g, "") === f.label.toLowerCase().replace(/\s+/g, "") ||
          h.toLowerCase() === f.key.toLowerCase()
      );
      if (match) m[f.key] = match;
    }
    return m;
  }, [fields, headers]);

  const onFile = async (file: File) => {
    setError(null);
    setLoading(true);
    try {
      const parsed = await parseUploadFile(file);
      setFileName(file.name);
      setHeaders(parsed.headers);
      setRawRows(parsed.rows);
      const initial: Record<string, string> = {};
      for (const f of fields) {
        const match = parsed.headers.find(
          (h) =>
            h.toLowerCase().replace(/\s+/g, "") === f.label.toLowerCase().replace(/\s+/g, "") ||
            h.toLowerCase() === f.key.toLowerCase()
        );
        if (match) initial[f.key] = match;
      }
      setMapping(initial);
      setStep("map");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not parse file");
    } finally {
      setLoading(false);
    }
  };

  const runValidate = () => {
    const mapped = applyColumnMapping(rawRows, mapping);
    const result = validateRows(mapped);
    setValidRows(result.valid);
    setIssues(result.issues);
    setStep("validate");
  };

  const confirmImport = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await runImport(validRows);
      setSummary(result);
      setStep("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep("upload");
    setFileName("");
    setHeaders([]);
    setRawRows([]);
    setMapping({});
    setIssues([]);
    setValidRows([]);
    setSummary(null);
    setError(null);
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="text-[16px] font-bold text-gray-900 mb-1">Bulk Import {entityLabel}</h3>
      <p className="text-[13px] text-gray-500 mb-4">Upload a .csv or .xlsx file, map columns, validate, then import.</p>

      {error && <p className="text-[13px] text-red-600 mb-3">{error}</p>}

      {step === "upload" && (
        <label className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 px-6 py-10 cursor-pointer hover:border-[#2548C9] hover:bg-[#EFF3FF]/30 transition-colors">
          <Upload className="h-8 w-8 text-gray-400" />
          <span className="text-[14px] font-semibold text-gray-700">Choose CSV or Excel file</span>
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onFile(f);
            }}
          />
          {loading && <Loader2 className="h-5 w-5 animate-spin text-gray-400" />}
        </label>
      )}

      {step === "map" && (
        <div className="space-y-4">
          <p className="text-[13px] text-gray-600">
            File: <strong>{fileName}</strong> — {rawRows.length} rows detected
          </p>
          {fields.map((f) => (
            <FormField key={f.key} label={f.label} required={f.required}>
              <select
                className={inputClass}
                value={mapping[f.key] ?? ""}
                onChange={(e) => setMapping((m) => ({ ...m, [f.key]: e.target.value }))}
              >
                <option value="">— skip —</option>
                {headers.map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </FormField>
          ))}
          <div className="flex gap-3">
            <button type="button" onClick={reset} className="rounded-lg border border-gray-200 px-4 py-2 text-[14px] font-semibold">
              Back
            </button>
            <button
              type="button"
              onClick={() => {
                setMapping((m) => ({ ...autoMapping, ...m }));
                runValidate();
              }}
              className="rounded-lg bg-[#2548C9] px-5 py-2 text-[14px] font-semibold text-white"
            >
              Validate
            </button>
          </div>
        </div>
      )}

      {step === "validate" && (
        <div className="space-y-4">
          <p className="text-[14px] text-gray-800">
            <strong>{validRows.length}</strong> rows ready to import
            {issues.length > 0 && (
              <>, <strong className="text-amber-700">{issues.length}</strong> skipped (validation errors)</>
            )}
          </p>
          {issues.length > 0 && (
            <div className="max-h-40 overflow-y-auto rounded-lg border border-amber-200 bg-amber-50 p-3 text-[12px] text-amber-900 space-y-1">
              {issues.slice(0, 20).map((i, idx) => (
                <div key={idx}>Row {i.row}: {i.message}</div>
              ))}
              {issues.length > 20 && <div>…and {issues.length - 20} more</div>}
            </div>
          )}
          <div className="flex gap-3">
            <button type="button" onClick={() => setStep("map")} className="rounded-lg border border-gray-200 px-4 py-2 text-[14px] font-semibold">
              Back
            </button>
            <button
              type="button"
              disabled={validRows.length === 0 || loading}
              onClick={() => void confirmImport()}
              className="flex items-center gap-2 rounded-lg bg-[#2548C9] px-5 py-2 text-[14px] font-semibold text-white disabled:opacity-50"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Import {validRows.length} rows
            </button>
          </div>
        </div>
      )}

      {step === "done" && summary && (
        <div className="space-y-3">
          <p className="text-[15px] font-semibold text-emerald-700">
            {summary.created} created, {issues.length} skipped (validation), {summary.failed} failed
          </p>
          {summary.errors.length > 0 && (
            <div className="text-[12px] text-red-700 space-y-1 max-h-32 overflow-y-auto">
              {summary.errors.map((e, i) => (
                <div key={i}>{e}</div>
              ))}
            </div>
          )}
          <button type="button" onClick={reset} className="rounded-lg border border-gray-200 px-4 py-2 text-[14px] font-semibold">
            Import another file
          </button>
        </div>
      )}
    </div>
  );
}
