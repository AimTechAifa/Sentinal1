"use client";

import { useEffect, useState } from "react";
import { ProgressLink } from "@/components/layout/NavigationProgress";
import { StatusBadge } from "@/components/badges/StatusBadge";
import { AdvancedCard } from "@/components/ui/advanced-card";
import { formatDate } from "@/lib/utils";
import type { DependencyImpactReport } from "@/lib/dependency-impact";
import { AlertTriangle, ArrowRight, Network } from "lucide-react";

export function DependencyImpactPanel({ releaseId }: { releaseId: string }) {
  const [report, setReport] = useState<DependencyImpactReport | null>(null);

  useEffect(() => {
    fetch(`/api/releases/${releaseId}/impact`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setReport);
  }, [releaseId]);

  if (!report) return null;

  return (
    <AdvancedCard
      title="Slip impact"
      subtitle="If this release moves, who else is affected?"
      icon={Network}
      variant="glass"
    >
      <p className="text-sm text-gray-700 mb-4">{report.summary}</p>
      <p className="text-xs text-amber-800 bg-amber-50 rounded-lg px-3 py-2 mb-4 border border-amber-100">
        {report.slipScenario}
      </p>

      {report.upstream.length > 0 && (
        <Section title="Upstream dependencies">
          {report.upstream.map((r) => (
            <ImpactRow key={r.id} node={r} />
          ))}
        </Section>
      )}

      {report.downstream.length > 0 && (
        <Section title={`Downstream (${report.transitiveDownstreamCount})`}>
          {report.downstream.map((r) => (
            <ImpactRow key={r.id} node={r} highlight={r.status === "Blocked" || r.status === "At Risk"} />
          ))}
        </Section>
      )}

      {report.sharedBookings.length > 0 && (
        <Section title="Shared env bookings (next 14 days)">
          {report.sharedBookings.map((b) => (
            <div key={b.id} className="flex items-start gap-2 text-sm py-2 border-b border-gray-100 last:border-0">
              <AlertTriangle className="h-4 w-4 text-warning-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-gray-800">
                  <strong>{b.application}</strong>
                  {b.environment ? ` / ${b.environment}` : ""} · {b.bookedBy}
                </p>
                <p className="text-xs text-gray-500">
                  {formatDate(b.fromDate)} → {formatDate(b.toDate)}
                  {b.releaseCode ? ` · ${b.releaseCode}` : ""}
                  {b.purpose ? ` · ${b.purpose}` : ""}
                </p>
              </div>
            </div>
          ))}
        </Section>
      )}

      {report.upstream.length === 0 &&
        report.downstream.length === 0 &&
        report.sharedBookings.length === 0 && (
          <p className="text-sm text-gray-500">No dependency or booking blast radius detected for this release.</p>
        )}
    </AdvancedCard>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4 last:mb-0">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">{title}</h4>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function ImpactRow({
  node,
  highlight,
}: {
  node: DependencyImpactReport["upstream"][0];
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm ${
        highlight ? "bg-warning-50/80 border border-warning-100" : "bg-gray-50/60"
      }`}
    >
      <div className="min-w-0">
        <ProgressLink href={node.href} className="font-mono text-xs text-brand-600 hover:underline">
          {node.releaseCode}
        </ProgressLink>
        <p className="text-gray-700 truncate">{node.name}</p>
        <span className="text-[10px] text-gray-400">
          {node.owner} · {formatDate(node.releaseDate)}
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <StatusBadge status={node.status as "Blocked"} />
        <ProgressLink href={node.href} className="text-brand-500">
          <ArrowRight className="h-4 w-4" />
        </ProgressLink>
      </div>
    </div>
  );
}
