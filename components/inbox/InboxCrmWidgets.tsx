"use client";

import { useMemo } from "react";
import Grid from "@mui/material/Grid";
import { CrmStatCard } from "@/components/materio/crm/CrmStatCard";
import { MeetingScheduleList } from "@/components/materio/crm/MeetingScheduleList";
import { TransactionsTable } from "@/components/materio/crm/TransactionsTable";
import type { InboxItem, InboxSection } from "@/lib/inbox-shared";
import { formatDate } from "@/lib/utils";
import { AlertTriangle, GitBranch, Inbox, Ticket } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { MaterioCard } from "@/components/materio/crm/MaterioCard";

type InboxCrmWidgetsProps = {
  loading: boolean;
  totalCount: number;
  attentionCount: number;
  p1Count: number;
  mappingCount: number;
  items: InboxItem[];
};

export function InboxCrmWidgets({
  loading,
  totalCount,
  attentionCount,
  p1Count,
  mappingCount,
  items,
}: InboxCrmWidgetsProps) {
  const stats = [
    { title: "Total items", value: loading ? "…" : totalCount, icon: Inbox, color: "primary" as const },
    { title: "Blocked & at risk", value: loading ? "…" : attentionCount, icon: AlertTriangle, color: "error" as const },
    { title: "Open P1s", value: loading ? "…" : p1Count, icon: Ticket, color: "warning" as const },
    { title: "Mapping conflicts", value: loading ? "…" : mappingCount, icon: GitBranch, color: "info" as const },
  ];

  const chartData = useMemo(() => {
    return [
      { name: "Blocked", value: attentionCount, color: "#ba1a1a" },
      { name: "P1 Issues", value: p1Count, color: "#fab005" },
      { name: "Mapping", value: mappingCount, color: "#228be6" },
      { name: "Approvals", value: items.filter((i) => i.section === "approvals").length, color: "#40c057" },
    ];
  }, [attentionCount, p1Count, mappingCount, items]);

  const scheduleItems = useMemo(
    () =>
      items
        .filter((i) => i.section === "approaching" || i.section === "approvals")
        .slice(0, 5)
        .map((i) => ({
          id: i.id,
          title: i.title,
          subtitle: i.reason,
          time: i.date ? formatDate(i.date) : "Soon",
          status: i.section,
          href: i.href,
          avatarLabel: i.title.slice(0, 2).toUpperCase(),
        })),
    [items]
  );

  const transactionRows = useMemo(
    () =>
      items.slice(0, 8).map((i) => ({
        id: i.id,
        primary: i.title,
        secondary: i.subtitle,
        meta: i.responsible,
        amount: i.date ? formatDate(i.date) : "—",
        status: sectionLabel(i.section),
        href: i.href,
      })),
    [items]
  );

  return (
    <div className="space-y-6">
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 5 }}>
          <Grid container spacing={3}>
            {stats.map((s) => (
              <Grid key={s.title} size={{ xs: 12, sm: 6 }}>
                <CrmStatCard title={s.title} value={s.value} icon={s.icon} color={s.color} />
              </Grid>
            ))}
          </Grid>
        </Grid>
        <Grid size={{ xs: 12, lg: 7 }}>
          <MaterioCard title="Inbox Overview" sx={{ display: 'flex', flexDirection: 'column' }}>
            <div className="h-[220px] w-full mt-2" style={{ minHeight: 0, minWidth: 0 }}>
              <ResponsiveContainer minWidth={0} minHeight={0} width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <Tooltip 
                    cursor={{ fill: '#f3f4f6' }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={50}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </MaterioCard>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 5 }}>
          <MeetingScheduleList
            items={scheduleItems}
            title="Action Schedule"
            subheader="Undecided releases and overdue approvals"
            emptyMessage="No scheduled checkpoints — inbox clear for this section."
          />
        </Grid>
        <Grid size={{ xs: 12, lg: 7 }}>
          <TransactionsTable
            rows={transactionRows}
            title="Inbox Queue"
            subheader="Items requiring release manager action"
            columns={{
              primary: "Item",
              secondary: "Context",
              meta: "Owner",
              amount: "Due",
              status: "Section",
            }}
            emptyMessage="No inbox items in scope."
          />
        </Grid>
      </Grid>
    </div>
  );
}

function sectionLabel(section: InboxSection): string {
  const map: Record<InboxSection, string> = {
    attention: "At risk",
    p1: "P1",
    approaching: "Undecided",
    mapping: "Mapping",
    approvals: "Approval",
    mine: "Mine",
  };
  return map[section];
}
