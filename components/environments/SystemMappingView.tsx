"use client";

import { useMemo } from "react";
import ReactFlow, { Background, Controls, MarkerType, Handle, Position, type Edge, type Node, type NodeMouseHandler } from "reactflow";
import "reactflow/dist/style.css";
import { GitBranch } from "lucide-react";
import { ProgressLink } from "@/components/layout/NavigationProgress";
import { AdvancedCard } from "@/components/ui/advanced-card";
import { releases } from "@/lib/dummy-data";
import type { EnterpriseSystemNode } from "@/lib/types";
import { cn } from "@/lib/utils";

const statusRing: Record<string, string> = {
  healthy: "ring-success-300",
  warning: "ring-warning-400 animate-pulse",
  critical: "ring-error-500 animate-pulse",
};

function SystemMapNode({
  data,
}: {
  data: {
    label: string;
    nodeType: "environment" | "application";
    status?: string;
    version?: string;
    selected?: boolean;
  };
}) {
  return (
    <div
      className={cn(
        "rounded-xl border-2 px-4 py-2.5 text-sm font-semibold shadow-sm min-w-[130px] text-center transition-all ring-2 ring-offset-1 relative",
        data.nodeType === "environment"
          ? "bg-brand-50 border-brand-300 text-brand-800"
          : "bg-brand-25 border-brand-200 text-brand-700",
        data.status && statusRing[data.status],
        data.selected && "scale-105 shadow-theme-md border-brand-500"
      )}
    >
      <Handle type="target" position={Position.Top} className="!opacity-0" />
      <div>{data.label}</div>
      {data.version && <div className="text-[10px] font-normal opacity-70 mt-0.5 font-mono uppercase tracking-wider">{data.version}</div>}
      {data.status && data.status !== "healthy" && (
        <div className="text-[9px] uppercase tracking-wide mt-1 opacity-80">{data.status}</div>
      )}
      <Handle type="source" position={Position.Bottom} className="!opacity-0" />
    </div>
  );
}

const nodeTypes = { systemMap: SystemMapNode };

export function SystemMappingView({
  nodes: systemNodes,
  selectedNodeId,
  onSelectNode,
}: {
  nodes: EnterpriseSystemNode[];
  selectedNodeId?: string | null;
  onSelectNode?: (node: EnterpriseSystemNode | null) => void;
}) {
  const { nodes, edges } = useMemo(() => {
    const positions: Record<string, { x: number; y: number }> = {
      "env-test-sap": { x: 200, y: 20 },
      "env-uat-asset": { x: 60, y: 140 },
      "env-dev-oracle": { x: 340, y: 140 },
      "env-prod-sap": { x: 200, y: 260 },
      "app-fin": { x: 20, y: 380 },
      "app-crm": { x: 340, y: 380 },
      "app-mobile": { x: 200, y: 380 },
    };

    const ns: Node[] = systemNodes.map((n) => ({
      id: n.id,
      type: "systemMap",
      data: {
        label: n.label,
        nodeType: n.type,
        status: n.status,
        version: n.version,
        selected: selectedNodeId === n.id,
      },
      position: positions[n.id] ?? { x: 0, y: 0 },
    }));

    const es: Edge[] = systemNodes
      .filter((n) => n.parentId && ns.some(sn => sn.id === n.parentId))
      .map((n) => ({
        id: `${n.parentId}-${n.id}`,
        source: n.parentId!,
        target: n.id,
        markerEnd: { type: MarkerType.ArrowClosed, color: "#64748B" },
        style: {
          stroke: n.status === "critical" ? "#EF4444" : n.status === "warning" ? "#F59E0B" : "#94A3B8",
          strokeWidth: 2,
        },
        animated: n.type === "environment" || n.status !== "healthy",
      }));

    return { nodes: ns, edges: es };
  }, [systemNodes, selectedNodeId]);

  const onNodeClick: NodeMouseHandler = (_, node) => {
    const match = systemNodes.find((n) => n.id === node.id);
    if (match) onSelectNode?.(selectedNodeId === match.id ? null : match);
  };

  const selected = systemNodes.find((n) => n.id === selectedNodeId);

  return (
    <AdvancedCard
      title="System Mapping"
      subtitle="Service dependency topology mapped to enterprise environments"
      icon={GitBranch}
      variant="glass"
      noPadding
    >
      <div className="h-[420px] border-t border-gray-100">
        <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} fitView fitViewOptions={{ padding: 0.35 }} onNodeClick={onNodeClick}>
          <Background gap={16} color="#E2E8F0" />
          <Controls className="!rounded-xl" />
        </ReactFlow>
      </div>
      {selected && (
        <div className="px-5 py-3 border-t border-gray-100 bg-brand-50/30 text-xs text-gray-600 flex flex-wrap items-center gap-3">
          <span>
            <strong className="text-gray-800">{selected.label}</strong>
            {selected.criticality && ` · ${selected.criticality} criticality`}
          </span>
          {selected.serviceId && (
            <span className="font-mono text-[10px] bg-white/80 px-2 py-0.5 rounded border">{selected.serviceId}</span>
          )}
          {selected.version && <span className="font-mono text-[10px] uppercase tracking-wider">Release target {selected.version}</span>}
          {selected.serviceId && (() => {
            const rel = releases.find((r) => r.dependsOnServices.includes(selected.serviceId!));
            if (!rel) return null;
            return (
              <ProgressLink
                href={`/releases/${rel.id}/dependencies`}
                className="ml-auto text-brand-600 hover:text-brand-700 font-medium"
              >
                View dependency map →
              </ProgressLink>
            );
          })()}
        </div>
      )}
      <div className="flex gap-4 px-5 py-3 text-[10px] text-gray-500 border-t border-gray-100">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-6 rounded border-2 border-brand-300 bg-brand-50" /> Environment
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-6 rounded border-2 border-brand-200 bg-brand-25" /> Application
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-error-500 animate-pulse" /> Unstable / incident
        </span>
      </div>
    </AdvancedCard>
  );
}
