"use client";

import { useEffect, useState } from "react";
import { AgentBadge } from "@/components/badges/AgentBadge";
import { AICardSkeleton } from "@/components/ui/AISkeleton";
import { AdvancedCard } from "@/components/ui/advanced-card";
import { useReleaseStore } from "@/context/ReleaseStoreContext";
import { callAgent } from "@/lib/agent-client";
import type { Release, RiskFlag } from "@/lib/types";
import { medianFilesChanged } from "@/lib/utils";
import { releases } from "@/lib/dummy-data";
import { useOrgContext } from "@/lib/use-org-context";
import { ChevronDown, ChevronUp, ShieldAlert } from "lucide-react";

export function AIRiskPanel({ release }: { release: Release }) {
  const orgContext = useOrgContext();
  const { getReleaseDecision, getDeploymentState } = useReleaseStore();
  const [flags, setFlags] = useState<RiskFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReasoning, setShowReasoning] = useState(false);
  const median = medianFilesChanged(releases);

  useEffect(() => {
    callAgent({
      agentRole: "Risk Agent",
      context: {
        release,
        medianFilesChanged: median,
        similarReleaseCount: 14,
        recordedDecision: getReleaseDecision(release.id),
        deployment: getDeploymentState(release),
        connectorIssues: orgContext.connectorIssues,
      },
      mode: "structured",
    }).then((res) => {
      if (res.flags) setFlags(res.flags as RiskFlag[]);
      else setError(res.error ?? "Unable to load risk analysis");
      setLoading(false);
    });
  }, [release, median, orgContext.connectorIssues, getReleaseDecision, getDeploymentState]);

  return (
    <div className="space-y-3">
      <AdvancedCard
        title="AI Risk Analysis"
        icon={ShieldAlert}
        variant="ai"
        action={<AgentBadge agent="Risk Agent" />}
      >
        {loading && <AICardSkeleton />}
        {error && !loading && <p className="text-sm text-error-600">{error}</p>}
        {!loading && !error && (
          <ul className="space-y-3">
            {flags.map((f, i) => (
              <li key={i} className="border border-brand-50 rounded-xl p-3 bg-white/80 backdrop-blur-sm">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-sm text-gray-800">{f.title}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${f.severity === "high" ? "bg-red-100 text-red-700" : f.severity === "medium" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-gray-600"}`}>{f.severity}</span>
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
      <button onClick={() => setShowReasoning(!showReasoning)} className="flex items-center gap-1 text-sm text-ai hover:text-brand-700 transition-colors">
        {showReasoning ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        View AI reasoning
      </button>
      {showReasoning && (
        <AdvancedCard variant="glass" innerClassName="p-4">
          <div className="text-sm text-gray-600 space-y-1">
            <p>Compared against 14 similar past releases in Platform team.</p>
            <p>Flagged because: file-change count ({release.filesChanged} vs ~{median} median), service criticality, pending Security approval duration.</p>
            <p>Release touches {release.dependsOnServices.length} services with {release.incidentHistory.length} prior incident(s) on record.</p>
          </div>
        </AdvancedCard>
      )}
    </div>
  );
}
