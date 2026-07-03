"use client";

import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import { AlertTriangle, Calendar, Flag, Package } from "lucide-react";
import { CrmStatCard } from "./CrmStatCard";
import { WeeklyOverviewChart } from "./WeeklyOverviewChart";
import { TotalGrowthChart } from "./TotalGrowthChart";
import { UpgradePlanCard } from "./UpgradePlanCard";
import { MeetingScheduleList, type ScheduleItem } from "./MeetingScheduleList";
import { ActivityFeedCard, type ActivityItem } from "./ActivityFeedCard";
import { TransactionsTable, type TransactionRow } from "./TransactionsTable";
import { buildGrowthSeries, buildSparkline, buildWeeklyOverview, pctChange } from "@/lib/materio/chart-data";

export type CrmDashboardProps = {
  counts: { planned: number; inProgress: number; blocked: number; atRisk: number };
  releases: { releaseDate?: string | Date | null; date?: string; status?: string; code?: string; name?: string; href?: string }[];
  scheduleItems?: ScheduleItem[];
  activityItems?: ActivityItem[];
  transactionRows?: TransactionRow[];
  sectionTitle?: string;
  transactionsTitle?: string;
  transactionsSubheader?: string;
  transactionColumns?: {
    primary: string;
    secondary?: string;
    meta?: string;
    amount?: string;
    status: string;
  };
};

export function CrmDashboardGrid({
  counts,
  releases,
  scheduleItems = [],
  activityItems = [],
  transactionRows = [],
  sectionTitle = "Sales Overview",
  transactionsTitle = "Recent Transactions",
  transactionsSubheader = "Releases and issues requiring attention",
  transactionColumns,
}: CrmDashboardProps) {
  const weekly = buildWeeklyOverview(releases);
  const growth = buildGrowthSeries(releases);
  const spark = buildSparkline(releases);
  const lastWeek = weekly[weekly.length - 1]?.releases ?? 0;
  const prevWeek = weekly[weekly.length - 2]?.releases ?? 0;
  const trend = pctChange(lastWeek, prevWeek);

  const stats = [
    { title: "Planned", value: counts.planned, icon: Calendar, color: "primary" as const, trend },
    { title: "In progress", value: counts.inProgress, icon: Package, color: "info" as const },
    { title: "Blocked", value: counts.blocked, icon: AlertTriangle, color: "error" as const },
    { title: "At risk", value: counts.atRisk, icon: Flag, color: "warning" as const },
  ];

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Typography variant="h6" sx={{ fontWeight: 600 }} color="text.primary">
        {sectionTitle}
      </Typography>

      <Grid container spacing={3}>
        {stats.map((s) => (
          <Grid key={s.title} size={{ xs: 12, sm: 6, lg: 3 }}>
            <CrmStatCard
              title={s.title}
              value={s.value}
              icon={s.icon}
              color={s.color}
            />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <WeeklyOverviewChart data={weekly} />
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <UpgradePlanCard />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <TotalGrowthChart data={growth} />
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <MeetingScheduleList items={scheduleItems} />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <TransactionsTable
            rows={transactionRows}
            title={transactionsTitle}
            subheader={transactionsSubheader}
            columns={transactionColumns}
          />
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <ActivityFeedCard items={activityItems} />
        </Grid>
      </Grid>
    </Box>
  );
}
