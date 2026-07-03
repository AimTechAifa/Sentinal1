"use client";

import { Calendar, FileText, Shield, Users } from "lucide-react";
import { StatusBadge } from "@/components/badges/StatusBadge";
import { AdvancedCard } from "@/components/ui/advanced-card";
import { cabSessions } from "@/lib/dummy-data";
import type { Release } from "@/lib/types";
import { cn, formatDate, formatDateTime } from "@/lib/utils";

const riskStyles: Record<string, string> = {
  Low: "bg-success-50 text-success-600",
  Medium: "bg-warning-50 text-warning-600",
  High: "bg-orange-50 text-orange-700",
  Critical: "bg-error-50 text-error-600",
};

export function CabPanel({ release }: { release: Release }) {
  const cr = release.changeRecord;
  if (!cr) return null;

  const session = cabSessions.find((s) => s.releaseIds.includes(release.id));

  return (
    <AdvancedCard
      title={`Change Record — ${cr.crNumber}`}
      subtitle={`ServiceNow · Submitted by ${cr.submittedBy}`}
      icon={FileText}
      variant="default"
      action={<StatusBadge status={cr.cabStatus} />}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="rounded-lg bg-slate-50 p-3">
          <p className="text-xs text-slate-500 mb-1">Risk tier</p>
          <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium", riskStyles[cr.riskTier])}>
            {cr.riskTier}
          </span>
        </div>
        <div className="rounded-lg bg-slate-50 p-3">
          <p className="text-xs text-slate-500 mb-1">Deploy window</p>
          <p className="text-sm text-slate-800">{formatDateTime(cr.scheduledStart)}</p>
          <p className="text-xs text-slate-400">to {formatDateTime(cr.scheduledEnd)}</p>
        </div>
        <div className="rounded-lg bg-slate-50 p-3">
          <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
            <Calendar className="w-3 h-3" /> CAB session
          </p>
          <p className="text-sm text-slate-800">{formatDateTime(cr.cabSessionDate)}</p>
          {session && <p className="text-xs text-slate-400">{session.title}</p>}
        </div>
      </div>

      <p className="text-sm text-slate-700 mb-4">{cr.description}</p>

      <div className="mb-4">
        <p className="text-xs font-medium text-slate-500 mb-2 flex items-center gap-1">
          <Shield className="w-3 h-3" /> Affected services
        </p>
        <div className="flex flex-wrap gap-2">
          {cr.affectedServices.map((s) => (
            <span key={s} className="text-xs bg-brand-50 text-brand-600 px-2 py-1 rounded-md">
              {s}
            </span>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 p-3 mb-4">
        <p className="text-xs font-medium text-slate-500 mb-1">Backout plan</p>
        <p className="text-sm text-slate-700">{cr.backoutPlan}</p>
      </div>

      {session && (
        <div className="flex items-center gap-2 text-sm text-slate-600 border-t border-slate-100 pt-3">
          <Users className="w-4 h-4 text-slate-400" />
          <span>
            On agenda: <strong>{session.title}</strong> · Chair: {session.chair} ·{" "}
            {formatDate(session.date)}
          </span>
        </div>
      )}
    </AdvancedCard>
  );
}
