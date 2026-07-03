"use client";

import { useEffect, useState, useMemo } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { AgentBadge } from "@/components/badges/AgentBadge";
import { AICardSkeleton } from "@/components/ui/AISkeleton";
import { AdvancedCard } from "@/components/ui/advanced-card";
import { TrendChart } from "@/components/insights/TrendChart";
import { PredictiveForecastPanel } from "@/components/predictive/PredictiveForecastPanel";
import { callAgent } from "@/lib/agent-client";
import { historicalTrend, releases, services } from "@/lib/dummy-data";
import { useOrgContext } from "@/lib/use-org-context";
import { predictAllReleases } from "@/lib/predictive";
import { taBtnPrimary, taInput } from "@/lib/styles";
import type { RiskFlag } from "@/lib/types";
import { MessageSquare, Send, Sparkles } from "lucide-react";

export default function InsightsPage() {
  const orgContext = useOrgContext();
  const [patterns, setPatterns] = useState<RiskFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);

  const unstableIds = useMemo(() => services.filter((s) => s.unstable).map((s) => s.id), []);
  const predictions = useMemo(() => predictAllReleases(releases, unstableIds), [unstableIds]);

  useEffect(() => {
    callAgent({
      agentRole: "Risk Agent",
      context: { historicalTrend, org: orgContext },
      mode: "structured",
    }).then((res) => {
      if (res.flags) setPatterns(res.flags as RiskFlag[]);
      else setError(res.error ?? "AI unavailable");
      setLoading(false);
    });
  }, [orgContext]);

  const ask = async () => {
    if (!question.trim()) return;
    setAsking(true);
    const res = await callAgent({
      agentRole: "Conversation Agent",
      context: orgContext,
      userMessage: question,
    });
    setAnswer(res.text ?? res.error ?? "AI unavailable");
    setAsking(false);
  };

  return (
    <div>
      <TopBar title="Insights" subtitle="Org-wide AI risk and trend analysis" highlight />

      <AdvancedCard title="Ask Insights" icon={MessageSquare} variant="ai" className="mb-6">
        <div className="flex gap-2">
          <input value={question} onChange={(e) => setQuestion(e.target.value)} onKeyDown={(e) => e.key === "Enter" && ask()} placeholder="Which team has the most blocked releases?" className={taInput} />
          <button onClick={ask} disabled={asking} className={`${taBtnPrimary} shrink-0 flex items-center gap-1`}><Send className="w-4 h-4" /> Ask</button>
        </div>
        {asking && <div className="mt-3"><AICardSkeleton /></div>}
        {answer && !asking && (
          <AdvancedCard variant="glass" innerClassName="p-4 mt-3" noPadding>
            <AgentBadge agent="Conversation Agent" className="mb-2" />
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{answer}</p>
          </AdvancedCard>
        )}
      </AdvancedCard>

      <TrendChart data={historicalTrend} />

      <div className="mt-6">
        <PredictiveForecastPanel predictions={predictions} compact />
      </div>

      <div className="mt-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-ai" />
          <h2 className="font-semibold text-gray-800">Patterns Detected</h2>
          <AgentBadge agent="Risk Agent" />
        </div>
        {loading && <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><AICardSkeleton /><AICardSkeleton /></div>}
        {error && !loading && <p className="text-sm text-error-600">{error}</p>}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {patterns.map((p, i) => (
              <AdvancedCard key={i} title={p.title} variant="ai">
                <p className="text-sm text-gray-600">{p.explanation}</p>
                {p.citations?.length > 0 && <p className="text-xs text-gray-400 mt-3">{p.citations.join(" · ")}</p>}
              </AdvancedCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
