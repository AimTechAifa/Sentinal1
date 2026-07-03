"use client";

import { useCallback, useEffect, useState } from "react";
import { AgentBadge } from "@/components/badges/AgentBadge";
import { AICardSkeleton } from "@/components/ui/AISkeleton";
import { AdvancedCard } from "@/components/ui/advanced-card";
import { callAgent } from "@/lib/agent-client";
import type { DbRiskAgentContext } from "@/lib/db-ai-context";
import { blockersToRiskFlags } from "@/lib/db-ai-context";
import type { RiskFlag } from "@/lib/types";
import { RefreshCw, ShieldAlert } from "lucide-react";
import { taBtnSecondary } from "@/lib/styles";

export function DbAIRiskPanel({ releaseId }: { releaseId: string }) {
  const [context, setContext] = useState<DbRiskAgentContext | null>(null);
  const [flags, setFlags] = useState<RiskFlag[]>([]);
  const [contextLoading, setContextLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usedFallback, setUsedFallback] = useState(false);

  useEffect(() => {
    setContext(null);
    setFlags([]);
    setError(null);
    setUsedFallback(false);
    setContextLoading(true);
    fetch(`/api/releases/${releaseId}/ai-context`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setContext)
      .finally(() => setContextLoading(false));
  }, [releaseId]);

  const runAnalysis = useCallback(async () => {
    if (!context) return;
    setAnalyzing(true);
    setError(null);
    setUsedFallback(false);

    const res = await callAgent({
      agentRole: "Risk Agent",
      context,
      mode: "structured",
    });

    setAnalyzing(false);

    if (res.flags?.length) {
      setFlags(res.flags as RiskFlag[]);
      return;
    }

    const err = res.error ?? "";
    setFlags(
      blockersToRiskFlags(context.blockers, context.release.releaseCode, context.readiness)
    );
    setUsedFallback(true);
    if (err && !/api key|llm|unavailable|timed out/i.test(err)) {
      setError(err);
    }
  }, [context]);

  useEffect(() => {
    if (context && !flags.length && !analyzing) {
      runAnalysis();
    }
  }, [context, flags.length, analyzing, runAnalysis]);

  return (
    <AdvancedCard
      title="AI risk analysis"
      icon={ShieldAlert}
      variant="ai"
      action={<AgentBadge agent="Risk Agent" />}
    >
      <p className="text-xs text-gray-500 mb-3">
        Live analysis from readiness, blockers, slip impact, Jira items, and env bookings for{" "}
        {context?.release.releaseCode ?? "this release"}.
      </p>

      {contextLoading && <AICardSkeleton />}

      {context && !contextLoading && (
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            type="button"
            className={taBtnSecondary + " text-sm !py-2"}
            onClick={runAnalysis}
            disabled={analyzing}
          >
            {analyzing ? (
              <>
                <RefreshCw className="h-4 w-4 inline animate-spin mr-1" /> Analyzing…
              </>
            ) : (
              "Re-run analysis"
            )}
          </button>
        </div>
      )}

      {analyzing && <AICardSkeleton />}

      {error && !analyzing && <p className="text-sm text-error-600 mb-3">{error}</p>}

      {usedFallback && !analyzing && flags.length > 0 && (
        <p className="text-xs text-amber-700 mb-3">
          Showing rule-based flags — add OPENAI_API_KEY or ANTHROPIC_API_KEY for full Risk Agent output.
        </p>
      )}

      {!analyzing && flags.length > 0 && (
        <ul className="space-y-3">
          {flags.map((f, i) => (
            <li
              key={i}
              className="border border-brand-50 rounded-xl p-3 bg-white/80 backdrop-blur-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium text-sm text-gray-800">{f.title}</p>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                    f.severity === "high"
                      ? "bg-red-100 text-red-700"
                      : f.severity === "medium"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-slate-100 text-gray-600"
                  }`}
                >
                  {f.severity}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">{f.explanation}</p>
              {f.citations?.length > 0 && (
                <p className="text-xs text-gray-400 mt-2">Sources: {f.citations.join(" · ")}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </AdvancedCard>
  );
}
