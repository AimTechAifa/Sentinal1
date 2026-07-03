"use client";

import { useState } from "react";
import { Flag } from "lucide-react";
import { callAgent } from "@/lib/agent-client";
import { AISkeleton } from "@/components/ui/AISkeleton";
import type { Release } from "@/lib/types";

interface RiskCacheEntry {
  text?: string;
  error?: string;
}

interface RiskHoverCellProps {
  release: Release;
  median: number;
  cache: Record<string, RiskCacheEntry>;
  onCacheUpdate: (releaseId: string, entry: RiskCacheEntry) => void;
}

export function RiskHoverCell({ release, median, cache, onCacheUpdate }: RiskHoverCellProps) {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const hasRisk = release.filesChanged > 400;
  if (!hasRisk) return null;

  const entry = cache[release.id];

  const handleMouseEnter = () => {
    setVisible(true);
    if (entry) return;

    setLoading(true);
    callAgent({
      agentRole: "Risk Agent",
      context: { release, medianFilesChanged: median },
      mode: "line",
    }).then((res) => {
      onCacheUpdate(
        release.id,
        res.text ? { text: res.text } : { error: res.error ?? "AI unavailable" }
      );
      setLoading(false);
    });
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setVisible(false)}
    >
      <Flag className="w-4 h-4 text-ai cursor-help" aria-label="Risk indicator" />
      {visible && (
        <div
          role="tooltip"
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 p-3 bg-slate-900 text-white text-xs rounded-lg shadow-lg pointer-events-none"
        >
          {loading && !entry && <AISkeleton lines={1} className="[&_div]:!bg-slate-600 [&_div]:shimmer" />}
          {entry?.text && <p className="leading-relaxed">{entry.text}</p>}
          {entry?.error && !loading && <p className="text-red-300">{entry.error}</p>}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
        </div>
      )}
    </div>
  );
}
