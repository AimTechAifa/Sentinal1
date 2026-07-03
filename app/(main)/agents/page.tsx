"use client";

import { TopBar } from "@/components/layout/TopBar";
import { agents } from "@/lib/dummy-data";
import { ArchitectureDiagram } from "@/components/agents/ArchitectureDiagram";
import { AgentActivityMarquee } from "@/components/agents/AgentActivityMarquee";
import { AgentControlHero } from "@/components/agents/AgentControlHero";
import { AgentCard } from "@/components/agents/AgentCard";
import { useReleaseStore } from "@/context/ReleaseStoreContext";

export default function AgentsPage() {
  const { isAgentPaused, setAgentPaused } = useReleaseStore();
  const featured = new Set(["ag5", "ag10", "ag7"]);

  return (
    <div className="relative overflow-x-hidden">
      <TopBar title="Agent Control Room" subtitle="13 AI agents watching releases, connectors, and deployments" />
      <AgentControlHero />
      <AgentActivityMarquee />
      <ArchitectureDiagram />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 mt-6">
        {agents.map((agent) => (
          <AgentCard
            key={agent.id}
            agent={agent}
            isPaused={isAgentPaused(agent.id)}
            onTogglePause={() => setAgentPaused(agent.id, !isAgentPaused(agent.id))}
            featured={featured.has(agent.id)}
          />
        ))}
      </div>
    </div>
  );
}
