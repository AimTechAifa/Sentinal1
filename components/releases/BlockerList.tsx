import { AlertTriangle } from "lucide-react";
import { ProgressLink } from "@/components/layout/NavigationProgress";
import { AdvancedCard } from "@/components/ui/advanced-card";
import { getReleaseBlockers } from "@/lib/blockers";
import type { Release } from "@/lib/types";

export function BlockerList({ release }: { release: Release }) {
  const blockers = getReleaseBlockers(release);

  return (
    <AdvancedCard title="Blockers" icon={AlertTriangle} variant="glass">
      {blockers.length === 0 ? (
        <p className="text-sm text-emerald-600">No blockers — release looks clear.</p>
      ) : (
        <ul className="space-y-2">
          {blockers.map((b) => (
            <li key={b.text} className="flex items-center gap-2 text-sm text-gray-700 rounded-lg bg-warning-50/50 px-3 py-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
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
      )}
    </AdvancedCard>
  );
}
