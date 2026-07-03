"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ProgressLink } from "@/components/layout/NavigationProgress";
import { callAgent } from "@/lib/agent-client";
import { releases } from "@/lib/dummy-data";
import { useOrgContext } from "@/lib/use-org-context";
import { AISkeleton } from "@/components/ui/AISkeleton";
import { ShimmerText } from "@/components/ui/shimmer-text";
import type { AgentMeta } from "@/lib/types";

export function AgentFindingsPanel({ agent, isPaused }: { agent: AgentMeta; isPaused?: boolean }) {
  const orgContext = useOrgContext();
  const [expanded, setExpanded] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFindings = () => {
    if (isPaused) return;
    if (summary || error || loading) return;
    setLoading(true);
    const context =
      agent.name === "Ticket Agent"
        ? {
            releases: releases
              .filter((r) => r.tickets.some((t) => t.status !== "Done"))
              .map((r) => ({ id: r.id, version: r.version, tickets: r.tickets })),
            sampleFindings: agent.sampleFindings,
          }
        : { org: orgContext, sampleFindings: agent.sampleFindings, agent: agent.name };

    callAgent({ agentRole: agent.name, context }).then((res) => {
      if (res.text) setSummary(res.text);
      else setError(res.error ?? "AI unavailable");
      setLoading(false);
    });
  };

  const handleToggle = (e: React.SyntheticEvent<HTMLDetailsElement>) => {
    const open = e.currentTarget.open;
    setExpanded(open);
    if (open && agent.liveAi && !isPaused) fetchFindings();
  };

  const renderFinding = (text: string, releaseId?: string) => {
    if (releaseId) {
      return (
        <ProgressLink href={`/releases/${releaseId}`} className="text-brand-600 hover:underline">
          {text}
        </ProgressLink>
      );
    }
    if (text.toLowerCase().includes("checkmarx")) {
      return (
        <ProgressLink href="/connectors?filter=issues#checkmarx" className="text-brand-600 hover:underline">
          {text}
        </ProgressLink>
      );
    }
    return text;
  };

  return (
    <details className="text-sm group/findings" onToggle={handleToggle}>
      <summary className="cursor-pointer list-none flex items-center gap-2">
        <ShimmerText className="text-xs font-semibold">
          {isPaused ? "Paused — findings frozen" : agent.liveAi ? "✦ Live AI analysis" : "Recent findings"}
        </ShimmerText>
        <motion.span
          className="text-gray-400 text-xs"
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          ▾
        </motion.span>
      </summary>
      <motion.div
        initial={false}
        animate={{ opacity: expanded ? 1 : 0 }}
        className="mt-3 space-y-2"
      >
        {expanded && isPaused && (
          <p className="text-xs text-gray-500">Resume this agent to refresh LLM analysis.</p>
        )}
        {expanded && agent.liveAi && !isPaused && loading && <AISkeleton lines={3} />}
        {expanded && error && !loading && <p className="text-xs text-error-600">{error}</p>}
        {expanded && summary && !loading && (
          <p className="text-gray-600 text-xs border-l-2 border-brand-200 pl-3 leading-relaxed whitespace-pre-wrap bg-brand-25/50 rounded-r-lg py-2">
            {summary}
          </p>
        )}
        {(!agent.liveAi || (expanded && isPaused)) && expanded && (
          <ul className="space-y-2">
            {agent.sampleFindings.map((f, i) => (
              <li key={i} className="text-gray-600 text-xs border-l-2 border-brand-100 pl-2">
                {renderFinding(f.text, f.releaseId)}
              </li>
            ))}
          </ul>
        )}
      </motion.div>
    </details>
  );
}
