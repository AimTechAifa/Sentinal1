"use client";

import { useSearchParams } from "next/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { KnowledgeGraphView } from "@/components/knowledge-graph/KnowledgeGraphView";

export default function KnowledgeGraphPage() {
  const searchParams = useSearchParams();
  const focusReleaseId = searchParams.get("release");

  return (
    <div>
      <TopBar
        title="Knowledge Graph"
        subtitle={
          focusReleaseId
            ? `Focused on release ${focusReleaseId.replace("rel-", "")} and connected services`
            : "Releases, services, people, tickets, and change records — connected"
        }
        highlight
      />
      <KnowledgeGraphView focusReleaseId={focusReleaseId} />
    </div>
  );
}
