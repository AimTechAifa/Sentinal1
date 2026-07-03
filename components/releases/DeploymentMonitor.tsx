"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Radio,
  RotateCcw,
  Rocket,
} from "lucide-react";
import { AgentBadge } from "@/components/badges/AgentBadge";
import { StatusBadge } from "@/components/badges/StatusBadge";
import { AdvancedCard } from "@/components/ui/advanced-card";
import { AICardSkeleton } from "@/components/ui/AISkeleton";
import { useReleaseStore } from "@/context/ReleaseStoreContext";
import { callAgent } from "@/lib/agent-client";
import type { Release, ReleaseDecision } from "@/lib/types";
import { cn, formatDateTime } from "@/lib/utils";

const metricColors = {
  healthy: "text-success-600 bg-success-50 border-success-100",
  warning: "text-warning-600 bg-warning-50 border-warning-100",
  critical: "text-error-600 bg-error-50 border-error-100",
};

export function DeploymentMonitor({
  release,
  decision,
}: {
  release: Release;
  decision: ReleaseDecision;
}) {
  const { getDeploymentState, startDeploy, tickDeploy, rollbackDeploy, setRollbackNarrative } = useReleaseStore();
  const deploy = getDeploymentState(release);
  const config = useMemo(
    () =>
      release.deployment ?? {
        environment: "production",
        cluster: "eks-prod-01",
        pipeline: "Argo CD",
        targetNamespace: "platform",
      },
    [release.deployment]
  );

  const isLive = deploy.phase === "In Progress" || deploy.phase === "Verifying";
  const [narrating, setNarrating] = useState(false);

  useEffect(() => {
    if (!isLive) return;
    const id = setInterval(() => tickDeploy(release), 2500);
    return () => clearInterval(id);
  }, [isLive, release, tickDeploy]);

  useEffect(() => {
    if (!deploy.autoRollback || deploy.rollbackNarrative || narrating) return;
    setNarrating(true);
    callAgent({
      agentRole: "Risk Agent",
      context: {
        release,
        autoRollback: true,
        rollbackReason: deploy.rollbackReason,
        metrics: deploy.metrics,
        deployment: config,
      },
    }).then((res) => {
      const text =
        res.text ??
        `Auto-rollback triggered: ${deploy.rollbackReason ?? "live metrics exceeded safe thresholds during canary rollout"}. Prior incident on payments-api and elevated file-change volume contributed to elevated rollback risk.`;
      setRollbackNarrative(release.id, text);
      setNarrating(false);
    });
  }, [
    deploy.autoRollback,
    deploy.rollbackNarrative,
    deploy.rollbackReason,
    deploy.metrics,
    config,
    narrating,
    release,
    setRollbackNarrative,
  ]);

  const canStart = decision === "Go" && ["Not Started", "Scheduled", "Failed"].includes(deploy.phase);
  const canRollback = ["In Progress", "Verifying", "Verified"].includes(deploy.phase);

  return (
    <AdvancedCard variant="glass" beam={isLive} glow={isLive} innerClassName="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Rocket className="w-5 h-5 text-brand-500" />
            <h3 className="font-semibold text-gray-900">Deployment & Live Monitoring</h3>
            {isLive && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase bg-red-50 text-red-600 px-2 py-0.5 rounded-full">
                <Radio className="w-3 h-3 animate-pulse" /> Live
              </span>
            )}
            {deploy.autoRollback && deploy.phase === "Rolled Back" && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase bg-error-50 text-error-600 px-2 py-0.5 rounded-full">
                Auto-rollback
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-1">
            {config.pipeline} → {config.environment} · {config.cluster} · ns/{config.targetNamespace}
          </p>
        </div>
        <StatusBadge status={deploy.phase} />
      </div>

      {deploy.autoRollback && (
        <div className="mb-4 rounded-xl border border-error-200 bg-gradient-to-r from-error-50/80 to-white p-4">
          <div className="flex items-start gap-3">
            <RotateCcw className={cn("w-5 h-5 text-error-600 shrink-0", narrating && "animate-spin")} />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-error-700">
                {narrating ? "Rolling back…" : "Rollback complete"}
              </p>
              <p className="text-sm text-error-600/90 mt-1">{deploy.rollbackReason}</p>
              <div className="mt-3">
                <AgentBadge agent="Risk Agent" className="mb-2" />
                {narrating && !deploy.rollbackNarrative && <AICardSkeleton />}
                {deploy.rollbackNarrative && (
                  <p className="text-sm text-gray-700 leading-relaxed">{deploy.rollbackNarrative}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {(deploy.phase === "In Progress" || deploy.rolloutPct > 0) && deploy.phase !== "Rolled Back" && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Rollout progress</span>
            <span>{deploy.rolloutPct}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-700",
                deploy.phase === "Verified" ? "bg-emerald-500" : "bg-brand-500"
              )}
              style={{ width: `${deploy.rolloutPct}%` }}
            />
          </div>
          {deploy.startedAt && (
            <p className="text-[10px] text-gray-400 mt-1">Started {formatDateTime(deploy.startedAt)}</p>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {deploy.metrics.map((m) => (
          <div
            key={m.id}
            className={cn(
              "rounded-lg border p-3 transition-all",
              metricColors[m.status],
              isLive && m.status === "critical" && "ring-2 ring-error-300 animate-pulse",
              isLive && "shadow-sm"
            )}
          >
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] font-medium opacity-80">{m.label}</p>
              {isLive && m.id !== "rollout" && <Activity className="w-3 h-3 opacity-60" />}
            </div>
            <p className="text-lg font-bold font-mono text-[10px] uppercase tracking-wider">
              {m.value}
              {m.unit && <span className="text-xs font-normal ml-0.5">{m.unit}</span>}
            </p>
            {m.threshold > 0 && m.id !== "rollout" && (
              <p className="text-[10px] opacity-60 mt-0.5">Threshold: {m.threshold}{m.unit}</p>
            )}
          </div>
        ))}
      </div>

      <div className="mb-4">
        <p className="text-xs font-medium text-gray-500 mb-2">Smoke tests</p>
        <div className="space-y-2">
          {deploy.smokeTests.map((t) => (
            <div key={t.id} className="flex items-center gap-2 text-sm">
              {t.status === "Passed" && <CheckCircle2 className="w-4 h-4 text-success-500 shrink-0" />}
              {t.status === "Running" && <Loader2 className="w-4 h-4 text-brand-500 animate-spin shrink-0" />}
              {t.status === "Failed" && <AlertTriangle className="w-4 h-4 text-error-500 shrink-0" />}
              {t.status === "Pending" && <span className="w-4 h-4 rounded-full border border-gray-300 shrink-0" />}
              <span className={cn(t.status === "Pending" && "text-gray-400")}>{t.name}</span>
              <span className="text-[10px] text-gray-400 ml-auto">{t.status}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-100">
        <button
          type="button"
          disabled={!canStart}
          onClick={() => startDeploy(release)}
          className="px-4 py-2 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Rocket className="w-4 h-4" /> Start deployment
        </button>
        <button
          type="button"
          disabled={!canRollback || deploy.autoRollback}
          onClick={() => rollbackDeploy(release)}
          className="px-4 py-2 bg-white border border-error-200 text-error-600 rounded-lg text-sm font-medium hover:bg-error-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <RotateCcw className="w-4 h-4" /> Initiate rollback
        </button>
        {!decision && (
          <p className="text-xs text-amber-600 self-center ml-1">Record Go decision before deploying</p>
        )}
        {decision === "No-Go" && (
          <p className="text-xs text-error-600 self-center ml-1">No-Go recorded — deployment blocked</p>
        )}
      </div>

      <p className="text-[10px] text-gray-400 mt-3">
        Auto-rollback fires when error rate or latency exceeds threshold during canary · Risk Agent narrates cause
      </p>
    </AdvancedCard>
  );
}
