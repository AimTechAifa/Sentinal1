"use client";

import { useEffect, useMemo, useState } from "react";
import ReactFlow, { Background, Controls, MiniMap, Node, Edge, MarkerType, type NodeMouseHandler, Panel } from "reactflow";
import "reactflow/dist/style.css";
import { ProgressLink } from "@/components/layout/NavigationProgress";
import { ArrowLeft, Network, Search } from "lucide-react";
import { ServiceNode } from "@/components/dependencies/ServiceNode";
import { AgentBadge } from "@/components/badges/AgentBadge";
import { AICardSkeleton } from "@/components/ui/AISkeleton";
import { AdvancedCard } from "@/components/ui/advanced-card";
import { TopBar } from "@/components/layout/TopBar";
import { ServiceDetailPanel } from "@/components/services/ServiceDetailPanel";
import { callAgent } from "@/lib/agent-client";
import { releases, services } from "@/lib/dummy-data";
import type { DependencyWarning } from "@/lib/types";

const nodeTypes = { service: ServiceNode };

// Mock data generator to match the screenshot's rich detail
function getMockData(id: string, unstable: boolean) {
  const hash = id.split("").reduce((a, b) => a + b.charCodeAt(0), 0);
  const code = `REL-0${(hash % 9000) + 1000}`;
  
  if (unstable) {
    return {
      code,
      statusType: hash % 2 === 0 ? "critical" : "blocked" as const,
      versionStr: hash % 2 === 0 ? "Critical Path" : "Blocked Service",
    };
  }
  return {
    code,
    statusType: hash % 2 === 0 ? "stable" : "staging" as const,
    versionStr: hash % 2 === 0 ? `v${hash % 5}.0.${hash % 10} Stable` : `v${hash % 3}.1.${hash % 5} Staging`,
  };
}

export function SyntheticDependenciesPage({ id }: { id: string }) {
  const release = releases.find((r) => r.id === id);
  const [warnings, setWarnings] = useState<DependencyWarning[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);

  useEffect(() => {
    if (!release) return;
    callAgent({
      agentRole: "Dependency Agent",
      context: { release, services, touchedServices: services.filter((s) => release.dependsOnServices.includes(s.id)) },
      mode: "structured",
    }).then((res) => {
      if (res.warnings) setWarnings(res.warnings as DependencyWarning[]);
      setLoading(false);
    });
  }, [release]);

  const { nodes, edges } = useMemo(() => {
    if (!release) return { nodes: [], edges: [] };
    const touched = new Set(release.dependsOnServices);
    
    const ns: Node[] = services.map((s, i) => {
      const mock = getMockData(s.id, !!s.unstable);
      return {
        id: s.id,
        type: "service",
        data: {
          label: s.name,
          code: mock.code,
          statusType: mock.statusType,
          versionStr: mock.versionStr,
          selected: selectedServiceId === s.id,
        },
        position: { x: (i % 3) * 350, y: Math.floor(i / 3) * 180 }, // Horizontal layout
      };
    });
    
    const es: Edge[] = services.flatMap((s) =>
      s.dependsOn.map((dep) => ({
        id: `${dep}-${s.id}`,
        source: dep,
        target: s.id,
        type: "smoothstep",
        markerEnd: { type: MarkerType.ArrowClosed, color: "#94A3B8" },
        style: { stroke: "#94A3B8", strokeWidth: 1.5, strokeDasharray: "5 5" },
      }))
    );
    
    return { nodes: ns, edges: es };
  }, [release, selectedServiceId]);

  const onNodeClick: NodeMouseHandler = (_, node) => {
    if (services.some((s) => s.id === node.id)) {
      setSelectedServiceId((prev) => (prev === node.id ? null : node.id));
    }
  };

  if (!release) return <p className="text-slate-500">Release not found.</p>;

  return (
    <div className="h-[calc(100vh-2rem)] flex flex-col bg-gray-50/50 -m-8 p-8">
      {/* Top Header matching screenshot */}
      <div className="flex items-center justify-between mb-4 bg-white p-4 rounded-xl shadow-theme-sm border border-gray-200">
        <div>
          <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            Dependency Map — {release.version} <span className="bg-brand-500 text-white text-[10px] px-2 py-0.5 rounded-full">LIVE</span>
          </h1>
          <ProgressLink href={`/releases/${release.id}`} className="text-xs text-brand-600 hover:underline flex items-center gap-1 mt-1 font-medium">
            <ArrowLeft className="w-3 h-3" /> Back to Release
          </ProgressLink>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search nodes..." 
              className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-1 gap-4 min-h-0 relative">
        {/* Full Canvas */}
        <div className="flex-1 rounded-xl overflow-hidden shadow-theme-sm border border-gray-200 bg-[#fbfcfd]">
          <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} fitView onNodeClick={onNodeClick}>
            <Background gap={16} color="#E2E8F0" />
            <Controls className="!rounded-xl shadow-theme-md border-gray-200" position="top-right" />
            
            {/* Map Legend */}
            <Panel position="bottom-left" className="bg-white rounded-xl shadow-theme-lg border border-gray-200 p-4 w-48 m-6">
              <h3 className="text-[10px] font-bold text-gray-400 tracking-wider uppercase mb-3">Map Legend</h3>
              <div className="space-y-2 text-xs font-medium text-gray-700">
                <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-success-500" /> Stable Release</div>
                <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-brand-500" /> Staging Mode</div>
                <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-warning-500" /> Critical Path</div>
                <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-error-500" /> Blocked Service</div>
              </div>
            </Panel>
          </ReactFlow>
        </div>

        {/* Floating Side Panel (Loads on Click) */}
        {selectedServiceId && (
          <div className="w-80 shrink-0 flex flex-col gap-4 min-h-0 overflow-y-auto animate-in slide-in-from-right-8 duration-300">
            <ServiceDetailPanel serviceId={selectedServiceId} onClose={() => setSelectedServiceId(null)} />
            <AdvancedCard title="Dependency Warnings" icon={Network} variant="ai" action={<AgentBadge agent="Dependency Agent" />} innerClassName="overflow-y-auto">
              {loading && <AICardSkeleton />}
              {!loading && warnings.map((w, i) => (
                <div key={i} className="rounded-xl border border-brand-50 bg-white p-3 mb-3 text-sm shadow-sm">
                  <p className="text-gray-700">{w.warning}</p>
                  {w.citations?.length > 0 && <p className="text-xs text-gray-400 mt-2">{w.citations.join(" · ")}</p>}
                </div>
              ))}
              {!loading && warnings.length === 0 && <p className="text-sm text-gray-500">No dependency warnings.</p>}
            </AdvancedCard>
          </div>
        )}
      </div>
    </div>
  );
}
