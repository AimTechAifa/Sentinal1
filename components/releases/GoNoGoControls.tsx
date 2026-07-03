"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { StatusBadge } from "@/components/badges/StatusBadge";
import { ReadinessGauge } from "@/components/gauges/ReadinessGauge";
import { AdvancedCard } from "@/components/ui/advanced-card";
import { ProgressLink } from "@/components/layout/NavigationProgress";
import { useReleaseStore } from "@/context/ReleaseStoreContext";
import type { Release, ReleaseDecision } from "@/lib/types";
import { getReleaseBlockers } from "@/lib/blockers";
import { calcReadiness } from "@/lib/utils";

export function GoNoGoControls({ release }: { release: Release }) {
  const { getReleaseDecision, setReleaseDecision } = useReleaseStore();
  const stored = getReleaseDecision(release.id);
  const decision: ReleaseDecision = stored?.decision ?? release.decision;
  const readiness = calcReadiness(release);
  const blockers = getReleaseBlockers(release);
  const hasBlockers = blockers.length > 0;
  const lowReadiness = readiness < 70;

  const [modalOpen, setModalOpen] = useState(false);
  const [pendingDecision, setPendingDecision] = useState<ReleaseDecision>(null);
  const [rationale, setRationale] = useState("");

  const applyDecision = (d: ReleaseDecision, override = false) => {
    setReleaseDecision(release.id, release.version, d, {
      rationale: override ? rationale : undefined,
      overridden: override,
    });
    setModalOpen(false);
    setRationale("");
    setPendingDecision(null);
  };

  const handleDecision = (d: ReleaseDecision) => {
    if (d === "Go" && (hasBlockers || lowReadiness)) {
      setPendingDecision(d);
      setModalOpen(true);
      return;
    }
    applyDecision(d);
  };

  return (
    <>
      <AdvancedCard variant="ai" beam glow innerClassName="p-5 flex flex-col items-center">
        <ReadinessGauge value={readiness} />
        <div className="flex items-center gap-2 mt-3">
          {decision && <StatusBadge status={decision} />}
          {stored?.overridden && (
            <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Override</span>
          )}
        </div>
        {stored && (
          <p className="text-xs text-slate-400 mt-2 text-center">
            {stored.decidedBy} · {new Date(stored.decidedAt).toLocaleString("en-AU")}
          </p>
        )}
        {stored?.rationale && (
          <p className="text-xs text-slate-500 mt-1 text-center max-w-xs">{stored.rationale}</p>
        )}
        <div className="flex gap-3 mt-4">
          <button
            onClick={() => handleDecision("Go")}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700"
          >
            Go
          </button>
          <button
            onClick={() => handleDecision("No-Go")}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
          >
            No-Go
          </button>
        </div>
        {(hasBlockers || lowReadiness) && !decision && (
          <p className="text-xs text-amber-600 mt-3 text-center">
            {hasBlockers ? `${blockers.length} blocker(s) open` : `Readiness ${readiness}% below 70%`}
            {" — override required for Go"}
          </p>
        )}
      </AdvancedCard>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="glass-panel max-w-md w-full p-6 shadow-theme-md">
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-slate-900">Override required</h3>
                <p className="text-sm text-slate-600 mt-1">
                  {release.version} has open blockers or low readiness. Record rationale to proceed with Go.
                </p>
              </div>
            </div>
            <ul className="text-sm text-slate-600 mb-4 space-y-1 list-disc list-inside">
              {blockers.slice(0, 4).map((b) => (
                <li key={b.text}>
                  {b.href ? (
                    <ProgressLink href={b.href} className="text-brand-600 hover:underline">
                      {b.text}
                    </ProgressLink>
                  ) : (
                    b.text
                  )}
                </li>
              ))}
            </ul>
            <textarea
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              placeholder="Rationale for Go decision (required)..."
              className="w-full border border-slate-200 rounded-lg p-3 text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
            <div className="flex gap-3 mt-4 justify-end">
              <button
                onClick={() => {
                  setModalOpen(false);
                  setRationale("");
                }}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg"
              >
                Cancel
              </button>
              <button
                disabled={!rationale.trim()}
                onClick={() => applyDecision(pendingDecision, true)}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
              >
                Confirm Go
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
