import { Sparkles } from "lucide-react";
import type { AgentRole } from "@/lib/types";
import { cn } from "@/lib/utils";

export function AgentBadge({ agent, className }: { agent: AgentRole; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium",
        "bg-brand-50 dark:bg-brand-500/20 text-brand-600 dark:text-brand-300 border border-brand-200/80 dark:border-brand-500/40",
        "shadow-none dark:shadow-none",
        className
      )}
    >
      <Sparkles className="w-3 h-3 animate-pulse" />
      {agent}
    </span>
  );
}
