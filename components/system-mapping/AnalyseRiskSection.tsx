"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { AlertTriangle, GitBranch, Search } from "lucide-react";
import { AdvancedCard } from "@/components/ui/advanced-card";
import type { MappingRisk } from "@/lib/system-mapping-types";
import { taInput } from "@/lib/styles";
import { formatDate } from "@/lib/utils";

type AnalyseRiskSectionProps = {
  onHighlightEdge: (edgeId: string | null) => void;
};

export function AnalyseRiskSection({ onHighlightEdge }: AnalyseRiskSectionProps) {
  const searchParams = useSearchParams();
  const [from, setFrom] = useState(() => new Date().toISOString().slice(0, 10));
  const [to, setTo] = useState(() => {
    const end = new Date();
    end.setDate(end.getDate() + 30);
    return end.toISOString().slice(0, 10);
  });
  const [urlDatesApplied, setUrlDatesApplied] = useState(false);
  const [analysing, setAnalysing] = useState(false);
  const [risks, setRisks] = useState<MappingRisk[]>([]);
  const [ran, setRan] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (urlDatesApplied) return;
    const urlFrom = searchParams.get("from");
    const urlTo = searchParams.get("to");
    if (urlFrom) setFrom(urlFrom);
    if (urlTo) setTo(urlTo);
    if (urlFrom || urlTo) setUrlDatesApplied(true);
  }, [searchParams, urlDatesApplied]);

  const runAnalysis = async () => {
    setAnalysing(true);
    setError(null);
    onHighlightEdge(null);
    try {
      const res = await fetch("/api/system-mapping/analyse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from, to }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Analysis failed.");
        setRisks([]);
        return;
      }
      setRisks(data.risks ?? []);
      setRan(true);
    } catch {
      setError("Request failed — please try again.");
      setRisks([]);
    } finally {
      setAnalysing(false);
    }
  };

  return (
    <AdvancedCard
      title="Analyse mapping risk"
      subtitle="Compare current mappings with environment bookings over a period"
      icon={GitBranch}
      variant="glass"
    >
      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr auto" }, alignItems: "end", mb: 3 }}>
        <div>
          <label className="text-xs text-gray-500">From</label>
          <input type="date" className={taInput} value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-gray-500">To</label>
          <input type="date" className={taInput} value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Search size={16} />}
          onClick={runAnalysis}
          disabled={analysing || !from || !to}
          sx={{ height: 40 }}
        >
          {analysing ? "Analysing…" : "Run analysis"}
        </Button>
      </Box>

      {error && (
        <Typography variant="body2" color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      {ran && risks.length === 0 && !error && (
        <Typography variant="body2" color="success.main">
          No booking conflicts found for mapped environments in the selected period.
        </Typography>
      )}

      {risks.length > 0 && (
        <div className="space-y-3">
          <Typography variant="subtitle2" sx={{ display: "flex", alignItems: "center", gap: 1, color: "error.main" }}>
            <AlertTriangle size={16} />
            {risks.length} conflict{risks.length === 1 ? "" : "s"} found
          </Typography>
          {risks.map((r, i) => (
            <button
              key={`${r.edgeId}-${i}`}
              type="button"
              onClick={() => onHighlightEdge(r.edgeId)}
              className="w-full text-left rounded-xl border border-error-200 bg-error-50/60 p-4 text-sm transition hover:border-error-300 hover:shadow-sm"
            >
              <p className="font-semibold text-error-800">
                {r.source} → {r.target}
                {r.groupName && <span className="ml-2 text-xs font-normal text-error-600">({r.groupName})</span>}
              </p>
              <p className="text-xs text-error-700 mt-1">{r.risk}</p>
              <p className="text-[10px] text-gray-500 mt-2">
                Env: {r.conflictEnv} · Booked {formatDate(r.fromDate)} → {formatDate(r.toDate)} · {r.purpose ?? "No purpose noted"}
              </p>
              {r.notes && <p className="text-xs text-gray-600 mt-2 italic">{r.notes}</p>}
            </button>
          ))}
        </div>
      )}
    </AdvancedCard>
  );
}
