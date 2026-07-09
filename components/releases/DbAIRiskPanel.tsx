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
import { cn } from "@/lib/utils";
import { loadJsonEffect } from "@/lib/safe-fetch";

const FLAG_STYLES = {
  high: {
    card: "border-error-200/80 bg-error-50/90 dark:border-error-500/30 dark:bg-error-500/12",
    badge: "bg-error-100 text-error-700 dark:bg-error-500/25 dark:text-error-400",
  },
  medium: {
    card: "border-warning-200/80 bg-warning-50/90 dark:border-warning-500/30 dark:bg-warning-500/12",
    badge: "bg-warning-100 text-warning-700 dark:bg-warning-500/25 dark:text-warning-400",
  },
  low: {
    card: "border-gray-200 bg-gray-50/90 dark:border-[var(--border)] dark:bg-white/5",
    badge: "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-white/65",
  },
} as const;

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
    return loadJsonEffect<DbRiskAgentContext>(
      `/api/releases/${releaseId}/ai-context`,
      setContext,
      { label: "release-ai-context", onFinally: () => setContextLoading(false) },
    );
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
      <p className="text-xs text-gray-500 dark:text-white/60 mb-3">
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

      {error && !analyzing && <p className="text-sm text-error-600 dark:text-error-400 mb-3">{error}</p>}

      {usedFallback && !analyzing && flags.length > 0 && (
        <p className="text-xs text-amber-700 dark:text-amber-400 mb-3">
          Showing rule-based flags — add OPENAI_API_KEY or ANTHROPIC_API_KEY for full Risk Agent output.
        </p>
      )}

      {!analyzing && flags.length > 0 && (
        <ul className="space-y-3">
          {flags.map((f, i) => {
            const styles = FLAG_STYLES[f.severity] ?? FLAG_STYLES.low;
            return (
            <li
              key={i}
              className={cn("rounded-xl border p-3", styles.card)}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium text-sm text-gray-900 dark:text-white">{f.title}</p>
                <span className={cn("text-xs px-2 py-0.5 rounded-full shrink-0 capitalize", styles.badge)}>
                  {f.severity}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-white/75 mt-1">{f.explanation}</p>
              {f.citations?.length > 0 && (
                <p className="text-xs text-gray-400 dark:text-white/45 mt-2">Sources: {f.citations.join(" · ")}</p>
              )}
            </li>
            );
          })}
        </ul>
      )}
    </AdvancedCard>
  );
}
