"use client";

import { BookCopy, Sparkles } from "lucide-react";
import { ProgressLink } from "@/components/layout/NavigationProgress";
import { AdvancedCard } from "@/components/ui/advanced-card";
import {
  RELEASE_PLAYBOOKS,
  playbookBookingDates,
  resolvePlaybookForm,
  type ReleasePlaybook,
} from "@/lib/release-playbooks";
import { cn } from "@/lib/utils";

type Lookups = {
  departments: { id: string; name: string }[];
  applications: { id: string; name: string; departmentId: string }[];
  releaseCodes: string[];
  owner: string;
};

export function ReleasePlaybookBar({
  lookups,
  onApply,
  onClone,
  canEdit,
}: {
  lookups: Lookups;
  onApply: (form: ReturnType<typeof resolvePlaybookForm>) => void;
  onClone: () => void;
  canEdit: boolean;
}) {
  if (!canEdit) return null;

  return (
    <AdvancedCard className="mb-4" title="Playbooks & clone" icon={Sparkles} variant="glass" innerClassName="py-4">
      <p className="text-xs text-gray-500 mb-3">
        Start from a standard template or clone an existing DB release — apps, deps, and checklist pre-filled.
      </p>
      <div className="flex flex-wrap gap-2">
        {RELEASE_PLAYBOOKS.map((pb) => (
          <PlaybookChip
            key={pb.id}
            playbook={pb}
            lookups={lookups}
            onClick={() =>
              onApply(
                resolvePlaybookForm(pb, lookups, lookups.releaseCodes, lookups.owner)
              )
            }
          />
        ))}
        <button
          type="button"
          onClick={onClone}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:border-brand-300 hover:text-brand-600"
        >
          <BookCopy className="h-3.5 w-3.5" /> Clone release…
        </button>
      </div>
    </AdvancedCard>
  );
}

function PlaybookChip({
  playbook,
  lookups,
  onClick,
}: {
  playbook: ReleasePlaybook;
  lookups: Lookups;
  onClick: () => void;
}) {
  const { fromDate, toDate, purpose } = playbookBookingDates(playbook);
  const appIds = playbook.applicationNames
    .map((name) => lookups.applications.find((a) => a.name === name)?.id)
    .filter(Boolean)
    .join(",");
  const bookingUrl = `/booking?from=${fromDate}&to=${toDate}&apps=${appIds}&purpose=${encodeURIComponent(purpose)}`;

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "rounded-lg border border-brand-200 bg-brand-50/60 px-3 py-1.5 text-left text-xs font-medium text-brand-800",
          "hover:bg-brand-100 transition-colors"
        )}
      >
        {playbook.title}
        <span className="block text-[10px] font-normal text-brand-600/80 mt-0.5">{playbook.description}</span>
      </button>
      <ProgressLink
        href={bookingUrl}
        className="text-[10px] text-gray-400 hover:text-brand-600 pl-1"
        onClick={(e) => e.stopPropagation()}
      >
        Suggested booking window →
      </ProgressLink>
    </div>
  );
}
