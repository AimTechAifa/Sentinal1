"use client";

import { useEffect, useMemo, useState, use } from "react";
import ReactFlow, { Background, Controls, MarkerType, type Edge, type Node } from "reactflow";
import "reactflow/dist/style.css";
import { ProgressLink } from "@/components/layout/NavigationProgress";
import { TopBar } from "@/components/layout/TopBar";
import { AdvancedCard } from "@/components/ui/advanced-card";
import { isSyntheticReleaseId } from "@/components/releases/SyntheticReleaseDetail";
import { SyntheticDependenciesPage } from "@/components/releases/SyntheticDependenciesPage";
import { DependencyImpactPanel } from "@/components/releases/DependencyImpactPanel";
import { ArrowLeft, Network } from "lucide-react";
import { loadJsonEffect } from "@/lib/safe-fetch";

type ReleaseDetail = {
  id: string;
  releaseCode: string;
  name: string;
  applications: { application: { id: string; name: string } }[];
  dependsOn: { dependsOnRelease: { id: string; releaseCode: string; name: string } }[];
};

type MappingEdge = {
  id: string;
  sourceApp: { name: string };
  sourceEnv: { name: string };
  targetApp: { name: string };
  targetEnv: { name: string };
  notes: string | null;
};

function DbDependenciesPage({ id }: { id: string }) {
  const [release, setRelease] = useState<ReleaseDetail | null>(null);
  const [edges, setEdges] = useState<MappingEdge[]>([]);

  useEffect(() => {
    const cleanupRelease = loadJsonEffect<ReleaseDetail>(
      `/api/releases/${id}`,
      setRelease,
      { label: "release-dependencies" },
    );
    const cleanupMapping = loadJsonEffect<{ edges?: MappingEdge[] }>(
      "/api/system-mapping",
      (d) => setEdges(d.edges ?? []),
      { label: "system-mapping" },
    );
    return () => {
      cleanupRelease();
      cleanupMapping();
    };
  }, [id]);

  const { nodes, flowEdges } = useMemo(() => {
    if (!release) return { nodes: [], flowEdges: [] as Edge[] };
    const ns: Node[] = [];
    const es: Edge[] = [];
    let y = 0;

    ns.push({
      id: release.id,
      position: { x: 250, y: 0 },
      data: { label: `${release.releaseCode}\n${release.name}` },
      style: { background: "#eef4ff", border: "1px solid #6366f1", borderRadius: 12, padding: 10, fontSize: 12, fontWeight: 600 },
    });

    release.applications.forEach((a, i) => {
      const nid = `app-${a.application.id}`;
      y = 120 + i * 90;
      ns.push({
        id: nid,
        position: { x: 80, y },
        data: { label: a.application.name },
        style: { background: "#f0fdf4", border: "1px solid #22c55e", borderRadius: 10, padding: 8, fontSize: 11 },
      });
      es.push({ id: `e-${nid}`, source: release.id, target: nid, markerEnd: { type: MarkerType.ArrowClosed }, animated: true });
    });

    release.dependsOn.forEach((d, i) => {
      const nid = `dep-${d.dependsOnRelease.id}`;
      ns.push({
        id: nid,
        position: { x: 480, y: 80 + i * 80 },
        data: { label: `${d.dependsOnRelease.releaseCode}\n${d.dependsOnRelease.name}` },
        style: { background: "#fff7ed", border: "1px solid #f97316", borderRadius: 10, padding: 8, fontSize: 11 },
      });
      es.push({ id: `e-${nid}`, source: nid, target: release.id, markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: "#f97316" } });
    });

    const appNames = new Set(release.applications.map((a) => a.application.name));
    edges
      .filter((e) => appNames.has(e.sourceApp.name) || appNames.has(e.targetApp.name))
      .forEach((e, i) => {
        const sid = `map-s-${e.sourceApp.name}`;
        const tid = `map-t-${e.targetApp.name}`;
        if (!ns.find((n) => n.id === sid)) {
          ns.push({
            id: sid,
            position: { x: 40, y: 320 + i * 60 },
            data: { label: `${e.sourceApp.name}\n${e.sourceEnv.name}` },
            style: { background: "#fafafa", border: "1px solid #d1d5db", borderRadius: 8, padding: 6, fontSize: 10 },
          });
        }
        if (!ns.find((n) => n.id === tid)) {
          ns.push({
            id: tid,
            position: { x: 320, y: 320 + i * 60 },
            data: { label: `${e.targetApp.name}\n${e.targetEnv.name}` },
            style: { background: "#fafafa", border: "1px solid #d1d5db", borderRadius: 8, padding: 6, fontSize: 10 },
          });
        }
        es.push({
          id: `map-${e.id}`,
          source: sid,
          target: tid,
          label: "maps to",
          labelStyle: { fontSize: 9 },
          markerEnd: { type: MarkerType.ArrowClosed },
          style: { stroke: "#94a3b8", strokeDasharray: "4 2" },
        });
      });

    return { nodes: ns, flowEdges: es };
  }, [release, edges]);

  if (!release) return <p className="text-gray-500">Loading…</p>;

  return (
    <div className="space-y-6">
      <ProgressLink href={`/releases/${id}`} className="inline-flex items-center gap-1 text-sm text-brand-600">
        <ArrowLeft className="h-4 w-4" /> Back to release
      </ProgressLink>
      <TopBar title="Dependency map" subtitle={`${release.releaseCode} — database-backed apps, release deps, and system mapping`} highlight />
      <DependencyImpactPanel releaseId={id} />
      <AdvancedCard title="Release dependency graph" icon={Network} variant="glass" noPadding innerClassName="h-[520px]">
        <ReactFlow nodes={nodes} edges={flowEdges} fitView>
          <Background />
          <Controls />
        </ReactFlow>
      </AdvancedCard>
    </div>
  );
}

export default function DependenciesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  if (isSyntheticReleaseId(id)) {
    return <SyntheticDependenciesPage id={id} />;
  }
  return <DbDependenciesPage id={id} />;
}
