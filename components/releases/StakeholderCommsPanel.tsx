"use client";

import { useCallback, useEffect, useState } from "react";
import { MessageSquare, Copy, RefreshCw } from "lucide-react";
import { AIPanel } from "@/components/ui/ai-panel";
import { AdvancedCard } from "@/components/ui/advanced-card";
import { callAgent } from "@/lib/agent-client";
import { buildFallbackComms, type StakeholderCommsContext } from "@/lib/stakeholder-comms";
import { taBtnSecondary } from "@/lib/styles";

export function StakeholderCommsPanel({
  releaseId,
  releaseCode,
}: {
  releaseId: string;
  releaseCode: string;
}) {
  const [context, setContext] = useState<StakeholderCommsContext | null>(null);
  const [draft, setDraft] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadContext = useCallback(async () => {
    const [releaseRes, ccRes, impactRes, workRes] = await Promise.all([
      fetch(`/api/releases/${releaseId}`),
      fetch(`/api/releases/${releaseId}/command-center`),
      fetch(`/api/releases/${releaseId}/impact`),
      fetch(`/api/releases/${releaseId}/work-items`),
    ]);

    if (!releaseRes.ok) return null;

    const release = await releaseRes.json();
    const cc = ccRes.ok ? await ccRes.json() : {};
    const impact = impactRes.ok ? await impactRes.json() : {};
    const work = workRes.ok ? await workRes.json() : { summary: { open: 0 } };

    return {
      releaseCode: release.releaseCode,
      name: release.name,
      owner: release.owner,
      status: release.status,
      releaseDate: release.releaseDate,
      department: release.department?.name ?? "—",
      readiness: cc.readiness ?? 0,
      blockerCount: cc.blockers?.length ?? 0,
      decision: release.decision ?? null,
      downstreamCount: impact.transitiveDownstreamCount ?? 0,
      openWorkItems: work.summary?.open ?? 0,
      slipSummary: impact.summary ?? null,
    } satisfies StakeholderCommsContext;
  }, [releaseId]);

  useEffect(() => {
    loadContext().then(setContext);
  }, [loadContext]);

  const generate = async () => {
    if (!context) return;
    setLoading(true);
    setError(null);
    setDraft(null);

    const fallback = buildFallbackComms(context);

    const res = await callAgent({
      agentRole: "Comms Agent",
      context: {
        mode: "stakeholder-update",
        release: context,
      },
    });

    setLoading(false);
    if (res.text?.trim()) {
      setDraft(res.text.trim());
    } else if (res.error && /api key|llm|unavailable|timed out/i.test(res.error)) {
      setDraft(fallback);
    } else {
      setError(res.error ?? "Could not generate comms draft");
      setDraft(fallback);
    }
  };

  const copy = async () => {
    if (!draft) return;
    await navigator.clipboard.writeText(draft);
  };

  return (
    <AdvancedCard title="Stakeholder comms" subtitle="Draft status update for email or Teams" icon={MessageSquare} variant="ai">
      <p className="text-xs text-gray-500 dark:text-white/60 mb-3">
        Uses live readiness, blockers, slip impact, and Jira counts for {releaseCode}.
      </p>
      <div className="flex flex-wrap gap-2 mb-4">
        <button type="button" className={taBtnSecondary + " text-sm !py-2"} onClick={generate} disabled={loading || !context}>
          {loading ? (
            <>
              <RefreshCw className="h-4 w-4 inline animate-spin mr-1" /> Drafting…
            </>
          ) : (
            "Draft update"
          )}
        </button>
        {draft && (
          <button type="button" className={taBtnSecondary + " text-sm !py-2"} onClick={copy}>
            <Copy className="h-4 w-4 inline mr-1" /> Copy
          </button>
        )}
      </div>

      <AIPanel title="Comms draft" agent="Comms Agent" loading={loading} error={error}>
        {draft && <p className="whitespace-pre-wrap text-sm">{draft}</p>}
      </AIPanel>
    </AdvancedCard>
  );
}
