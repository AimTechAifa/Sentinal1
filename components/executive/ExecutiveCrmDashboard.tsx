"use client";

import { useMemo } from "react";
import Grid from "@mui/material/Grid";
import { CrmStatCard } from "@/components/materio/crm/CrmStatCard";
import { WeeklyOverviewChart } from "@/components/materio/crm/WeeklyOverviewChart";
import { TotalGrowthChart } from "@/components/materio/crm/TotalGrowthChart";
import { MeetingScheduleList } from "@/components/materio/crm/MeetingScheduleList";
import { ActivityFeedCard } from "@/components/materio/crm/ActivityFeedCard";
import { TransactionsTable } from "@/components/materio/crm/TransactionsTable";
import { buildGrowthSeries, buildWeeklyOverview } from "@/lib/materio/chart-data";
import { releases } from "@/lib/dummy-data";
import type { ReleasePrediction } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { AlertTriangle, Brain, Briefcase, Calendar, TrendingDown, TrendingUp } from "lucide-react";

type PortfolioStats = {
  activeCount: number;
  atRiskCount: number;
  avgShipSuccess: number;
  shippingThisWeek: number;
  highRollbackCount: number;
  avgReadiness: number;
};

export function ExecutiveCrmDashboard({
  portfolio,
  predictions,
}: {
  portfolio: PortfolioStats;
  predictions: ReleasePrediction[];
}) {
  const releaseRows = useMemo(
    () =>
      releases.map((r) => ({
        date: r.targetDate,
        status: r.status,
      })),
    []
  );

  const weekly = buildWeeklyOverview(releaseRows);
  const growth = buildGrowthSeries(releaseRows);

  const stats = [
    { title: "Active releases", value: portfolio.activeCount, icon: Briefcase, color: "primary" as const },
    { title: "At risk / blocked", value: portfolio.atRiskCount, icon: AlertTriangle, color: "error" as const },
    { title: "Avg ship success", value: `${portfolio.avgShipSuccess}%`, icon: Brain, color: "info" as const },
    { title: "Shipping this week", value: portfolio.shippingThisWeek, icon: Calendar, color: "success" as const },
    { title: "High rollback forecast", value: portfolio.highRollbackCount, icon: TrendingDown, color: "warning" as const },
    { title: "Org avg readiness", value: `${portfolio.avgReadiness}%`, icon: TrendingUp, color: "primary" as const },
  ];

  const scheduleItems = useMemo(
    () =>
      releases
        .filter((r) => r.status === "At Risk" || r.status === "Scheduled" || r.status === "Ready")
        .slice(0, 5)
        .map((r) => ({
          id: r.id,
          title: r.name,
          subtitle: r.team,
          time: formatDate(r.targetDate),
          status: r.status,
          href: `/releases/${r.id}`,
          avatarLabel: r.version.slice(0, 2),
        })),
    []
  );

  const transactionRows = useMemo(
    () =>
      predictions
        .filter((p) => p.rollbackRiskPct >= 40 || p.shipSuccessPct < 70)
        .slice(0, 8)
        .map((p) => ({
          id: p.releaseId,
          primary: p.version,
          secondary: p.team,
          meta: "ML forecast",
          amount: `${p.shipSuccessPct}% ship`,
          status: p.rollbackRiskPct >= 50 ? "High rollback" : "At risk",
        })),
    [predictions]
  );

  const activityItems = useMemo(
    () =>
      predictions.slice(0, 4).map((p, i) => ({
        id: p.releaseId,
        title: `Risk Agent scored ${p.version}`,
        description: `${p.shipSuccessPct}% ship success · ${p.rollbackRiskPct}% rollback risk`,
        time: i === 0 ? "Just now" : `${i + 1}h ago`,
        type: "agent" as const,
      })),
    [predictions]
  );

  return (
    <div className="space-y-6">
      <Grid container spacing={3}>
        {stats.map((s) => (
          <Grid key={s.title} size={{ xs: 12, sm: 6, lg: 4, xl: 2 }}>
            <CrmStatCard title={s.title} value={s.value} icon={s.icon} color={s.color} />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <WeeklyOverviewChart
            data={weekly}
            title="Weekly Release Load"
            subheader="Demo portfolio — releases per week"
          />
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <MeetingScheduleList
            items={scheduleItems}
            title="Upcoming Go/No-Go"
            subheader="Demo command center checkpoints"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <TotalGrowthChart
            data={growth}
            title="Portfolio Growth"
            subheader="Demo releases vs shipped volume"
          />
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <ActivityFeedCard items={activityItems} title="Agent Activity" />
        </Grid>
      </Grid>

      <TransactionsTable
        rows={transactionRows}
        title="Releases at Risk"
        subheader="ML-predicted rollback and ship success"
        columns={{
          primary: "Release",
          secondary: "Team",
          meta: "Source",
          amount: "Forecast",
          status: "Risk",
        }}
      />
    </div>
  );
}
