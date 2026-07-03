"use client";

import { useMemo, useState } from "react";
import { Sparkles, RotateCcw } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { AdvancedCard } from "@/components/ui/advanced-card";
import { QuickStartTemplateCard } from "@/components/templates/QuickStartTemplateCard";
import {
  QUICK_START_CATEGORIES,
  QUICK_START_TEMPLATES,
  getTemplatesByCategory,
  type QuickStartCategory,
} from "@/lib/quick-start-templates";
import { useReleaseStore } from "@/context/ReleaseStoreContext";
import { cn } from "@/lib/utils";
import { taBtnSecondary } from "@/lib/styles";

type FilterCategory = QuickStartCategory | "All";

export default function TemplatesPage() {
  const [category, setCategory] = useState<FilterCategory>("All");
  const { resetDemoState } = useReleaseStore();

  const templates = useMemo(() => getTemplatesByCategory(category), [category]);

  const counts = useMemo(() => {
    const map = new Map<FilterCategory, number>();
    map.set("All", QUICK_START_TEMPLATES.length);
    QUICK_START_CATEGORIES.forEach((c) => {
      map.set(c, QUICK_START_TEMPLATES.filter((t) => t.category === c).length);
    });
    return map;
  }, []);

  return (
    <div className="space-y-6">
      <TopBar
        title="Quick Start Templates"
        subtitle={`${QUICK_START_TEMPLATES.length} guided demo scenarios across release management workflows`}
        highlight
      />

      <AdvancedCard variant="glass" icon={Sparkles} title="Demo mode" subtitle="Interactive scenarios with optional state seeding">
        <p className="text-sm text-gray-600">
          Each template navigates to the right screen and optionally pre-seeds demo state (deployments,
          Go decisions, notifications). Use{" "}
          <strong className="font-medium text-gray-800">Reset demo state</strong> to clear local changes
          and return to the default storyline.
        </p>
        <button
          type="button"
          onClick={resetDemoState}
          className={cn(taBtnSecondary, "mt-3 gap-1.5")}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset demo state
        </button>
      </AdvancedCard>

      <div className="flex flex-wrap gap-2">
        {(["All", ...QUICK_START_CATEGORIES] as FilterCategory[]).map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            className={cn(
              "text-xs rounded-full border px-3 py-1.5 transition-colors",
              category === c
                ? "border-brand-300 bg-brand-50 text-brand-700 font-medium"
                : "border-gray-200 bg-white/80 text-gray-600 hover:bg-brand-50 hover:border-brand-200"
            )}
          >
            {c}
            <span className="ml-1.5 text-gray-400">({counts.get(c) ?? 0})</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {templates.map((template) => (
          <QuickStartTemplateCard key={template.id} template={template} />
        ))}
      </div>
    </div>
  );
}
