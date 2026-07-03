import type { Edge, Node } from "reactflow";
import type { MappingEdgeRow } from "@/lib/system-mapping-types";

export function edgesToFlowGraph(edges: MappingEdgeRow[]): { nodes: Node[]; edges: Edge[] } {
  const nodeMap = new Map<string, { label: string; kind: "app" | "env" }>();

  edges.forEach((e) => {
    const srcKey = `${e.sourceApp?.name ?? "?"}:${e.sourceEnv?.name ?? "?"}`;
    const tgtKey = `${e.targetApp?.name ?? "?"}:${e.targetEnv?.name ?? "?"}`;
    if (!nodeMap.has(srcKey)) {
      nodeMap.set(srcKey, { label: `${e.sourceApp?.name}\n${e.sourceEnv?.name}`, kind: "env" });
    }
    if (!nodeMap.has(tgtKey)) {
      nodeMap.set(tgtKey, { label: `${e.targetApp?.name}\n${e.targetEnv?.name}`, kind: "env" });
    }
  });

  const keys = Array.from(nodeMap.keys());
  const cols = Math.ceil(Math.sqrt(keys.length));
  const nodes: Node[] = keys.map((key, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const meta = nodeMap.get(key)!;
    return {
      id: key,
      type: "default",
      position: { x: col * 180 + 20, y: row * 90 + 20 },
      data: { label: meta.label },
      style: {
        fontSize: 10,
        padding: 8,
        borderRadius: 8,
        border: "2px solid #3b5bdb",
        background: "#f3efff",
        width: 140,
        textAlign: "center" as const,
      },
    };
  });

  const flowEdges: Edge[] = edges.map((e, i) => {
    const srcKey = `${e.sourceApp?.name ?? "?"}:${e.sourceEnv?.name ?? "?"}`;
    const tgtKey = `${e.targetApp?.name ?? "?"}:${e.targetEnv?.name ?? "?"}`;
    return {
      id: `e-${i}`,
      source: srcKey,
      target: tgtKey,
      label: e.direction === "upstream" ? "↑" : "→",
      style: { stroke: "#3b5bdb", strokeWidth: 2 },
      labelStyle: { fontSize: 10, fill: "#6d6b77" },
    };
  });

  return { nodes, edges: flowEdges };
}
