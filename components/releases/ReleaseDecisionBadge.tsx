"use client";

import { StatusBadge } from "@/components/badges/StatusBadge";
import { useReleaseStore } from "@/context/ReleaseStoreContext";

export function ReleaseDecisionBadge({ releaseId, fallback = null }: { releaseId: string; fallback?: string | null }) {
  const { getReleaseDecision } = useReleaseStore();
  const stored = getReleaseDecision(releaseId);
  const decision = stored?.decision ?? fallback;
  if (!decision) return <span className="text-gray-400 text-xs">—</span>;
  return <StatusBadge status={decision} />;
}
