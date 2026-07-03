"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Play, Clock } from "lucide-react";
import { AdvancedCard } from "@/components/ui/advanced-card";
import { useQuickStartLauncher } from "@/lib/use-quick-start-launcher";
import type { QuickStartTemplate } from "@/lib/quick-start-templates";
import { cn } from "@/lib/utils";
import { taBtnPrimary, taBtnSecondary } from "@/lib/styles";

export function QuickStartTemplateCard({ template }: { template: QuickStartTemplate }) {
  const [expanded, setExpanded] = useState(false);
  const launch = useQuickStartLauncher();
  const Icon = template.icon;

  return (
    <AdvancedCard
      variant="ai"
      beam
      title={template.title}
      subtitle={template.category}
      icon={Icon}
      action={
        <span className="inline-flex items-center gap-1 text-[11px] text-gray-400 shrink-0">
          <Clock className="w-3 h-3" />
          {template.duration}
        </span>
      }
    >
      <p className="text-sm text-gray-600 leading-relaxed">{template.description}</p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {template.highlights.map((tag) => (
          <span
            key={tag}
            className="text-[11px] rounded-full bg-brand-50/80 text-brand-700 px-2.5 py-0.5 border border-brand-100"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => launch(template.href, template.seed)}
          className={cn(taBtnPrimary, "gap-1.5")}
        >
          <Play className="w-3.5 h-3.5" />
          Launch demo
        </button>
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className={cn(taBtnSecondary, "gap-1.5")}
        >
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          {expanded ? "Hide steps" : "Demo steps"}
        </button>
      </div>

      {expanded && (
        <ol className="mt-4 space-y-2 border-t border-gray-100 pt-4">
          {template.steps.map((step, i) => (
            <li key={step.label} className="flex gap-3 text-sm">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
                {i + 1}
              </span>
              <div>
                <p className="font-medium text-gray-800">{step.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{step.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </AdvancedCard>
  );
}
