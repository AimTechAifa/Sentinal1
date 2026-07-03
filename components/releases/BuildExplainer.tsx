"use client";

import { useEffect, useState } from "react";
import { AgentBadge } from "@/components/badges/AgentBadge";
import { AICardSkeleton } from "@/components/ui/AISkeleton";
import { AdvancedCard } from "@/components/ui/advanced-card";
import { callAgent } from "@/lib/agent-client";
import type { BuildExplanation, Release } from "@/lib/types";
import { Hammer } from "lucide-react";

export function BuildExplainer({ release }: { release: Release }) {
  const [data, setData] = useState<BuildExplanation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (release.build.status !== "Failed") { setLoading(false); return; }
    callAgent({
      agentRole: "Build Agent",
      context: { release, buildLog: "22 integration test failures in invoice module" },
      mode: "structured",
    }).then((res) => {
      if (res.build) setData(res.build as BuildExplanation);
      else setError(res.error ?? "Unable to analyze build");
      setLoading(false);
    });
  }, [release]);

  if (release.build.status !== "Failed") return null;

  return (
    <AdvancedCard
      title="Build Failure Explainer"
      icon={Hammer}
      variant="ai"
      action={<AgentBadge agent="Build Agent" />}
    >
      {loading && <AICardSkeleton />}
      {error && !loading && <p className="text-sm text-error-600">{error}</p>}
      {data && !loading && (
        <div className="space-y-3 text-sm">
          <div><span className="font-medium text-gray-700">Likely cause:</span> <span className="text-gray-600">{data.cause}</span></div>
          <div><span className="font-medium text-gray-700">Suspect commit:</span> <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">{data.suspectCommit}</code></div>
          <div><span className="font-medium text-gray-700">Suggested next step:</span> <span className="text-gray-600">{data.nextStep}</span></div>
          {data.citations?.length > 0 && <p className="text-xs text-gray-400">Sources: {data.citations.join(" · ")}</p>}
        </div>
      )}
    </AdvancedCard>
  );
}
