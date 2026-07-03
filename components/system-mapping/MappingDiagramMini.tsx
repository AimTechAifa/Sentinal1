"use client";

import { useMemo } from "react";
import ReactFlow, { Background, Controls, ReactFlowProvider } from "reactflow";
import "reactflow/dist/style.css";
import { edgesToFlowGraph } from "@/lib/system-mapping-diagram";
import type { MappingEdgeRow } from "@/lib/system-mapping-types";

type MappingDiagramMiniProps = {
  edges: MappingEdgeRow[];
  height?: number;
  highlightEdgeId?: string | null;
};

function MappingDiagramMiniInner({ edges, height = 220, highlightEdgeId }: MappingDiagramMiniProps) {
  const { nodes, edges: flowEdges } = useMemo(() => edgesToFlowGraph(edges), [edges]);

  const styledEdges = useMemo(
    () =>
      flowEdges.map((e, i) => {
        const edgeId = edges[i]?.id;
        const highlighted = highlightEdgeId && edgeId === highlightEdgeId;
        return {
          ...e,
          animated: !!highlighted,
          style: {
            stroke: highlighted ? "#ff4c51" : "#3b5bdb",
            strokeWidth: highlighted ? 3 : 2,
          },
        };
      }),
    [flowEdges, edges, highlightEdgeId]
  );

  if (!edges.length) {
    return (
      <div
        className="flex items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/50 text-xs text-gray-500"
        style={{ height }}
      >
        No edges to display
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-100 overflow-hidden bg-white" style={{ height }}>
      <ReactFlow
        nodes={nodes}
        edges={styledEdges}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnDrag={false}
        zoomOnScroll={false}
        zoomOnPinch={false}
        zoomOnDoubleClick={false}
        preventScrolling
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={12} size={1} color="#e8e8e8" />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}

export function MappingDiagramMini(props: MappingDiagramMiniProps) {
  return (
    <ReactFlowProvider>
      <MappingDiagramMiniInner {...props} />
    </ReactFlowProvider>
  );
}
