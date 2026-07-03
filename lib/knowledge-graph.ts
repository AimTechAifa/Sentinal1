import type { KgEdge, KgNode, Release, Service, TeamMember } from "./types";
import { chartColors } from "./palette";

const COL = { person: 0, release: 280, service: 560, ticket: 840, change: 840, incident: 560 };
const ROW_H = 72;

export function buildKnowledgeGraph(
  releases: Release[],
  services: Service[],
  teamMembers: TeamMember[],
  opts?: { maxReleases?: number }
): { nodes: KgNode[]; edges: KgEdge[] } {
  const maxReleases = opts?.maxReleases ?? 10;
  const active = releases.filter((r) => r.status !== "Shipped").slice(0, maxReleases);
  const nodes: KgNode[] = [];
  const edges: KgEdge[] = [];
  const addedPeople = new Set<string>();

  active.forEach((r) => {
    nodes.push({
      id: r.id,
      type: "release",
      label: r.version,
      sublabel: r.team,
      href: `/releases/${r.id}`,
      meta: { status: r.status },
    });

    const owner = teamMembers.find((m) => m.name === r.owner);
    const personId = owner ? owner.id : `person-${r.owner.replace(/\s/g, "-").toLowerCase()}`;
    if (!addedPeople.has(personId)) {
      addedPeople.add(personId);
      nodes.push({
        id: personId,
        type: "person",
        label: r.owner,
        sublabel: owner?.role ?? "Owner",
      });
    }
    edges.push({ id: `e-own-${r.id}`, source: personId, target: r.id, label: "owns" });

    r.dependsOnServices.forEach((sid) => {
      edges.push({ id: `e-dep-${r.id}-${sid}`, source: r.id, target: sid, label: "touches" });
    });

    r.tickets
      .filter((t) => t.status !== "Done")
      .slice(0, 2)
      .forEach((t) => {
        const tid = `tkt-${t.id}`;
        if (!nodes.find((n) => n.id === tid)) {
          nodes.push({
            id: tid,
            type: "ticket",
            label: t.id,
            sublabel: t.title.slice(0, 40),
            href: `/releases/${r.id}`,
            meta: { status: t.status },
          });
        }
        edges.push({ id: `e-tkt-${r.id}-${t.id}`, source: r.id, target: tid, label: "has" });
      });

    if (r.changeRecord) {
      const cid = `cr-${r.changeRecord.crNumber}`;
      if (!nodes.find((n) => n.id === cid)) {
        nodes.push({
          id: cid,
          type: "change",
          label: r.changeRecord.crNumber,
          sublabel: `${r.changeRecord.riskTier} risk`,
          href: `/releases/${r.id}`,
          meta: { cabStatus: r.changeRecord.cabStatus },
        });
      }
      edges.push({ id: `e-cr-${r.id}`, source: r.id, target: cid, label: "change" });
    }
  });

  const usedServices = new Set(active.flatMap((r) => r.dependsOnServices));
  services.forEach((s) => {
    if (!usedServices.has(s.id)) return;
    nodes.push({
      id: s.id,
      type: "service",
      label: s.name,
      sublabel: s.criticality,
      meta: { unstable: s.unstable ? "true" : "false" },
    });
    s.dependsOn.forEach((dep) => {
      if (usedServices.has(dep)) {
        edges.push({ id: `e-svc-${dep}-${s.id}`, source: dep, target: s.id, label: "depends" });
      }
    });
  });

  services.forEach((s) => {
    if (!usedServices.has(s.id)) return;
    s.recentIncidents.slice(0, 1).forEach((inc) => {
      const iid = `inc-${inc.id}`;
      if (!nodes.find((n) => n.id === iid)) {
        nodes.push({
          id: iid,
          type: "incident",
          label: inc.severity,
          sublabel: inc.summary.slice(0, 36),
          meta: { date: inc.date },
        });
      }
      edges.push({ id: `e-inc-${s.id}-${inc.id}`, source: s.id, target: iid, label: "incident" });
    });
  });

  return { nodes, edges };
}

export function layoutKgNodes(nodes: KgNode[]): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  const typeCounts: Record<string, number> = {};

  nodes.forEach((n) => {
    const idx = typeCounts[n.type] ?? 0;
    typeCounts[n.type] = idx + 1;
    positions.set(n.id, {
      x: COL[n.type] + (idx % 2) * 40,
      y: 40 + idx * ROW_H,
    });
  });

  return positions;
}

export const KG_LEGEND: { type: KgNode["type"]; label: string; color: string }[] = [
  { type: "person", label: "People", color: chartColors.person },
  { type: "release", label: "Releases", color: chartColors.release },
  { type: "service", label: "Services", color: chartColors.service },
  { type: "ticket", label: "Tickets", color: chartColors.ticket },
  { type: "change", label: "Change records", color: chartColors.change },
  { type: "incident", label: "Incidents", color: chartColors.incident },
];
