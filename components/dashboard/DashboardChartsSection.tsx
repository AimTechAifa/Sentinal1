"use client";

import { useMemo } from "react";
import Grid from "@mui/material/Grid";
import { WeeklyOverviewChart } from "@/components/materio/crm/WeeklyOverviewChart";
import { TotalProfitChart } from "@/components/materio/crm/TotalProfitChart";
import { MeetingScheduleList, type ScheduleItem } from "@/components/materio/crm/MeetingScheduleList";
import { ActivityFeedCard, type ActivityItem } from "@/components/materio/crm/ActivityFeedCard";
import { UpgradePlanCard } from "@/components/materio/crm/UpgradePlanCard";
import {
  buildPortfolioStackSeries,
  buildPortfolioSummary,
  buildWeeklyOverview,
} from "@/lib/materio/chart-data";

type Props = {
  releases: { releaseDate?: string | Date | null; date?: string; status?: string }[];
  scheduleItems?: ScheduleItem[];
  activityItems?: ActivityItem[];
  upgradeTitle?: string;
  upgradeDescription?: string;
  upgradeCtaLabel?: string;
  upgradeCtaHref?: string;
  reportHref?: string;
};

export function DashboardChartsSection({
  releases,
  scheduleItems = [],
  activityItems = [],
  upgradeTitle,
  upgradeDescription,
  upgradeCtaLabel,
  upgradeCtaHref,
  reportHref,
}: Props) {
  const weekly = useMemo(() => buildWeeklyOverview(releases), [releases]);
  const stack = useMemo(() => buildPortfolioStackSeries(releases), [releases]);
  const stackSummary = useMemo(() => buildPortfolioSummary(stack), [stack]);

  return (
    <>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12 }}>
          <TotalProfitChart data={stack} summary={stackSummary} reportHref={reportHref} />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <WeeklyOverviewChart data={weekly} />
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <UpgradePlanCard
            title={upgradeTitle}
            description={upgradeDescription}
            ctaLabel={upgradeCtaLabel}
            ctaHref={upgradeCtaHref}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <ActivityFeedCard
            items={activityItems}
            title="Connector activity"
            subheader="Recent sync events from integrated sources"
          />
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <MeetingScheduleList items={scheduleItems} />
        </Grid>
      </Grid>
    </>
  );
}
