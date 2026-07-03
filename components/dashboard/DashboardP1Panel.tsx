"use client";

import { MaterioCard } from "@/components/materio/crm/MaterioCard";
import { TransactionsTable, type TransactionRow } from "@/components/materio/crm/TransactionsTable";
import { AlertTriangle } from "lucide-react";

type P1Issue = {
  externalId: string;
  title: string;
  application: string | null;
  releaseCode: string | null;
  status: string;
};

export function DashboardP1Panel({ issues }: { issues: P1Issue[] }) {
  const rows: TransactionRow[] = issues.slice(0, 6).map((p) => ({
    id: p.externalId,
    primary: p.externalId,
    secondary: p.title,
    meta: p.application ?? "—",
    amount: p.releaseCode ?? "—",
    status: p.status,
  }));

  return (
    <TransactionsTable
      rows={rows}
      title="P1 Incidents"
      subheader="May require hotfix — release manager attention"
      columns={{
        primary: "ID",
        secondary: "Title",
        meta: "Application",
        amount: "Release",
        status: "Status",
      }}
      emptyMessage="No open P1 incidents in scope."
    />
  );
}

/** Compact Materio wrapper when used outside TransactionsTable context. */
export function DashboardP1Card({ issues }: { issues: P1Issue[] }) {
  if (issues.length === 0) {
    return (
      <MaterioCard title="P1 Incidents" subheader="May require hotfix — release manager attention">
        <p className="text-sm text-gray-500 py-2">No open P1 incidents in scope.</p>
      </MaterioCard>
    );
  }
  return <DashboardP1Panel issues={issues} />;
}

export { AlertTriangle };
