"use client";

import { useEffect, useMemo, useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { ExecutiveCrmDashboard } from "@/components/executive/ExecutiveCrmDashboard";
import { AIPanel } from "@/components/ui/ai-panel";
import { TeamRiskHeatmap } from "@/components/executive/TeamRiskHeatmap";
import { ReleasesAtRiskTable } from "@/components/executive/ReleasesAtRiskTable";
import { PredictiveForecastPanel } from "@/components/predictive/PredictiveForecastPanel";
import { callAgent } from "@/lib/agent-client";
import { getExecutiveContext, releases, services } from "@/lib/dummy-data";
import { useReleaseStore } from "@/context/ReleaseStoreContext";
import {
  getPortfolioStats,
  getTeamRiskHeatmap,
  predictAllReleases,
} from "@/lib/predictive";

export default function ExecutivePage() {
  const { liveOrgContext } = useReleaseStore();
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const unstableIds = useMemo(() => services.filter((s) => s.unstable).map((s) => s.id), []);
  const predictions = useMemo(() => predictAllReleases(releases, unstableIds), [unstableIds]);
  const heatmap = useMemo(() => getTeamRiskHeatmap(releases), []);
  const portfolio = useMemo(() => getPortfolioStats(releases, predictions), [predictions]);

  useEffect(() => {
    callAgent({
      agentRole: "Summary Agent",
      context: { ...getExecutiveContext(predictions, portfolio), org: liveOrgContext },
    }).then((res) => {
      setSummary(res.text ?? null);
      setLoading(false);
    });
  }, [predictions, portfolio, liveOrgContext]);

  return (
    <div className="space-y-6">
      <TopBar
        title="Executive Dashboard"
        subtitle="Portfolio view — risk heatmap, ML forecasts, and board-ready metrics"
        highlight
      />

      <ExecutiveCrmDashboard portfolio={portfolio} predictions={predictions} />

      <AIPanel title="Executive Briefing" agent="Summary Agent" loading={loading}>
        {summary && <p>{summary}</p>}
      </AIPanel>

      <TeamRiskHeatmap data={heatmap} />
      <ReleasesAtRiskTable predictions={predictions} />
      <PredictiveForecastPanel predictions={predictions} />
    </div>
  );
}
