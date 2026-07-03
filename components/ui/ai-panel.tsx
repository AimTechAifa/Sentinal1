"use client";

import { AgentBadge } from "@/components/badges/AgentBadge";
import type { AgentRole } from "@/lib/types";

interface AIPanelProps {
  title: string;
  agent: AgentRole;
  children?: React.ReactNode;
  loading?: boolean;
  error?: string | null;
}

function PanelSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <div className="h-3 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
      <div className="h-3 w-[92%] animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
      <div className="h-3 w-[78%] animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
      <div className="h-3 w-[65%] animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
    </div>
  );
}

export function AIPanel({ title, agent, children, loading, error }: AIPanelProps) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-brand-200 dark:border-[var(--border)] bg-brand-50/40 dark:bg-[var(--card)] p-5 shadow-sm">
      <div className="absolute bottom-0 left-0 top-0 w-1 bg-brand-500" />
      <div className="mb-4 flex items-center justify-between gap-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h3>
        <AgentBadge agent={agent} />
      </div>
      
      {loading && <PanelSkeleton />}
      
      {error && !loading && (
        <p className="text-sm text-error-600">{error}</p>
      )}
      
      {children && !loading && (
        <div className="text-sm leading-relaxed text-gray-700 dark:text-white/85">
          {children}
        </div>
      )}
    </div>
  );
}
