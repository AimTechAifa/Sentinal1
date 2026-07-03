import { CheckSquare } from "lucide-react";
import { StatusBadge } from "@/components/badges/StatusBadge";
import { AdvancedCard } from "@/components/ui/advanced-card";
import type { Release } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

export function ApprovalChecklist({ release }: { release: Release }) {
  return (
    <AdvancedCard title="Approval Checklist" icon={CheckSquare} variant="default">
      <div className="space-y-2">
        {release.approvals.map((a) => (
          <div key={a.gate} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
            <span className="text-sm font-medium text-gray-700">{a.gate}</span>
            <div className="flex items-center gap-3">
              {a.approver && <span className="text-xs text-gray-500">{a.approver}</span>}
              {a.timestamp && <span className="text-xs text-gray-400">{formatDateTime(a.timestamp)}</span>}
              <StatusBadge status={a.status} />
            </div>
          </div>
        ))}
      </div>
    </AdvancedCard>
  );
}
