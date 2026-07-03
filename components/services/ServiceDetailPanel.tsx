"use client";

import { ProgressLink } from "@/components/layout/NavigationProgress";
import { StatusBadge } from "@/components/badges/StatusBadge";
import { AdvancedCard } from "@/components/ui/advanced-card";
import { buildServiceDetail, getServiceMlHint } from "@/lib/service-detail";
import { releases, services } from "@/lib/dummy-data";
import { cn, formatDate } from "@/lib/utils";
import { AlertTriangle, Server, X } from "lucide-react";

const riskStyles = {
  healthy: "bg-success-50 text-success-700 border-success-200",
  warning: "bg-warning-50 text-warning-700 border-warning-200",
  critical: "bg-error-50 text-error-700 border-error-200",
};

interface ServiceDetailPanelProps {
  serviceId: string | null;
  onClose: () => void;
  className?: string;
}

export function ServiceDetailPanel({ serviceId, onClose, className }: ServiceDetailPanelProps) {
  if (!serviceId) return null;

  const unstableIds = new Set(services.filter((s) => s.unstable).map((s) => s.id));
  const detail = buildServiceDetail(serviceId, services, releases);
  if (!detail) return null;

  const ml = getServiceMlHint(serviceId, releases, unstableIds);

  return (
    <AdvancedCard
      variant="ai"
      className={cn("w-full", className)}
      action={
        <button type="button" onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
          <X className="w-4 h-4" />
        </button>
      }
    >
      <div className="flex items-start gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50">
          <Server className="w-5 h-5 text-brand-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-800">{detail.service.name}</h3>
          <p className="text-xs text-gray-500">{detail.service.criticality} · {detail.service.id}</p>
          <span className={cn("inline-block mt-2 text-[10px] font-medium px-2 py-0.5 rounded-full border capitalize", riskStyles[detail.riskStatus])}>
            {detail.riskStatus} risk
          </span>
        </div>
      </div>

      <p className="text-sm text-gray-600 mb-4">{detail.riskSummary}</p>

      {detail.service.unstable && (
        <p className="text-xs text-error-600 flex items-center gap-1 mb-3">
          <AlertTriangle className="w-3.5 h-3.5" /> Marked unstable in service registry
        </p>
      )}

      {ml && (
        <div className="rounded-lg bg-white/70 border border-brand-50 p-3 mb-4 text-xs">
          <p className="text-gray-500">Lowest ML ship forecast among touching releases</p>
          <p className="font-medium text-gray-800 mt-1">
            {ml.version}: {ml.shipSuccessPct}% ship · {ml.rollbackRiskPct}% rollback risk
          </p>
        </div>
      )}

      <section className="mb-4">
        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Incident history</p>
        {detail.service.recentIncidents.length === 0 ? (
          <p className="text-sm text-gray-500">No recent incidents on record.</p>
        ) : (
          <ul className="space-y-2">
            {detail.service.recentIncidents.map((inc) => (
              <li key={inc.id} className="text-sm border-b border-gray-100 pb-2 last:border-0">
                <StatusBadge status={inc.severity === "Sev-1" ? "Blocked" : inc.severity === "Sev-2" ? "At Risk" : "Pending"} />
                <span className="ml-2 text-gray-700">{inc.summary}</span>
                <p className="text-xs text-gray-400 mt-0.5">{formatDate(inc.date)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mb-4">
        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Releases touching this service</p>
        {detail.releasesTouching.length === 0 ? (
          <p className="text-sm text-gray-500">None in current portfolio.</p>
        ) : (
          <ul className="space-y-2">
            {detail.releasesTouching.map((r) => (
              <li key={r.releaseId}>
                <ProgressLink href={`/releases/${r.releaseId}`} className="flex items-center justify-between text-sm hover:bg-brand-50 rounded-lg px-2 py-1.5 -mx-2">
                  <span className="font-medium text-brand-500">{r.version}</span>
                  <span className="text-xs text-gray-500">{r.readiness}% · {r.blockers} blockers</span>
                </ProgressLink>
              </li>
            ))}
          </ul>
        )}
      </section>

      {(detail.upstream.length > 0 || detail.dependents.length > 0) && (
        <section>
          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Dependencies</p>
          {detail.upstream.length > 0 && (
            <p className="text-xs text-gray-600 mb-1">
              Upstream: {detail.upstream.map((s) => s.name).join(", ")}
            </p>
          )}
          {detail.dependents.length > 0 && (
            <p className="text-xs text-gray-600">
              Dependents: {detail.dependents.map((s) => s.name).join(", ")}
            </p>
          )}
        </section>
      )}
    </AdvancedCard>
  );
}
