"use client";

import { useMemo } from "react";
import { CrmDashboardGrid } from "@/components/materio/crm/CrmDashboardGrid";
import type { ActivityItem } from "@/components/materio/crm/ActivityFeedCard";
import type { ScheduleItem } from "@/components/materio/crm/MeetingScheduleList";
import type { TransactionRow } from "@/components/materio/crm/TransactionsTable";
import { formatDate, formatDateTime } from "@/lib/utils";
import type { NeedsAttentionItem } from "@/lib/needs-attention";

type ReleaseLike = {
  releaseDate?: string | Date | null;
  date?: string;
  status?: string;
  code?: string;
  name?: string;
  href?: string;
};

type OverviewRelease = {
  code: string;
  name: string;
  status: string;
  date: string;
  href: string;
  group?: string;
};

type Props = {
  counts: { planned: number; inProgress: number; blocked: number; atRisk: number };
  overviewReleases?: OverviewRelease[];
  attention?: NeedsAttentionItem[];
  p1Issues?: {
    externalId: string;
    title: string;
    application: string | null;
    releaseCode: string | null;
    status: string;
  }[];
  connectors?: { name: string; lastSynced: string }[];
  sectionTitle?: string;
};

export function CrmPortfolioDashboard({
  counts,
  overviewReleases = [],
  attention = [],
  p1Issues = [],
  connectors = [],
  sectionTitle,
}: Props) {
  const releases: ReleaseLike[] = useMemo(
    () =>
      overviewReleases.map((r) => ({
        date: r.date,
        status: r.status,
        code: r.code,
        name: r.name,
        href: r.href,
      })),
    [overviewReleases]
  );

  const scheduleItems: ScheduleItem[] = useMemo(
    () =>
      attention.slice(0, 5).map((a) => ({
        id: a.id,
        title: a.name,
        subtitle: a.reason,
        time: formatDate(a.date),
        status: a.status,
        href: a.href,
        avatarLabel: a.code.slice(0, 2),
      })),
    [attention]
  );

  const fallbackSchedule: ScheduleItem[] = useMemo(
    () =>
      overviewReleases
        .filter((r) => r.status === "Scheduled" || r.status === "Planned" || r.status === "At Risk")
        .slice(0, 5)
        .map((r) => ({
          id: r.code,
          title: r.name,
          subtitle: r.group,
          time: formatDate(r.date),
          status: r.status,
          href: r.href,
          avatarLabel: r.code.slice(0, 2),
        })),
    [overviewReleases]
  );

  const transactionRows: TransactionRow[] = useMemo(() => {
    const fromP1 = p1Issues.slice(0, 6).map((p) => ({
      id: p.externalId,
      primary: p.externalId,
      secondary: p.title,
      meta: p.application ?? "—",
      amount: p.releaseCode ?? "—",
      status: p.status,
    }));
    if (fromP1.length > 0) return fromP1;

    return attention.slice(0, 6).map((a) => ({
      id: a.id,
      primary: a.code,
      secondary: a.name,
      meta: a.group,
      amount: formatDate(a.date),
      status: a.status,
      href: a.href,
    }));
  }, [p1Issues, attention]);

  const activityItems: ActivityItem[] = useMemo(
    () =>
      connectors.slice(0, 4).map((c, i) => ({
        id: c.name,
        title: `${c.name} synced`,
        description: "Connector refresh completed for release desk data.",
        time: formatDateTime(c.lastSynced),
        type: i === 0 ? "agent" : "release",
      })),
    [connectors]
  );

  return (
    <CrmDashboardGrid
      counts={counts}
      releases={releases}
      scheduleItems={scheduleItems.length > 0 ? scheduleItems : fallbackSchedule}
      activityItems={activityItems}
      transactionRows={transactionRows}
      sectionTitle={sectionTitle ?? "Portfolio Overview"}
      transactionsTitle="P1 Issues"
      transactionsSubheader="May require hotfix — release manager attention"
      transactionColumns={{
        primary: "ID",
        secondary: "Title",
        meta: "Application",
        amount: "Release",
        status: "Status",
      }}
    />
  );
}
