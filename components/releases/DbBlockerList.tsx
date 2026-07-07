import { AlertTriangle } from "lucide-react";
import { ProgressLink } from "@/components/layout/NavigationProgress";
import { AdvancedCard } from "@/components/ui/advanced-card";
import type { DbBlocker } from "@/lib/db-release-command";

export function DbBlockerList({ blockers }: { blockers: DbBlocker[] }) {
  return (
    <AdvancedCard title="Blockers" icon={AlertTriangle} variant="glass">
      {blockers.length === 0 ? (
        <p className="text-sm text-emerald-600 dark:text-emerald-400">No blockers — release looks clear.</p>
      ) : (
        <ul className="space-y-2">
          {blockers.map((b) => (
            <li
              key={b.text}
              className="flex items-center gap-2 text-sm text-gray-700 dark:text-white/80 rounded-lg bg-warning-50/50 dark:bg-warning-500/10 px-3 py-2"
            >
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
              {b.href?.startsWith("http") ? (
                <a href={b.href} target="_blank" rel="noopener noreferrer" className="text-brand-600 dark:text-brand-400 hover:underline">
                  {b.text}
                </a>
              ) : b.href ? (
                <ProgressLink href={b.href} className="text-brand-600 dark:text-brand-400 hover:underline">
                  {b.text}
                </ProgressLink>
              ) : (
                b.text
              )}
            </li>
          ))}
        </ul>
      )}
    </AdvancedCard>
  );
}
