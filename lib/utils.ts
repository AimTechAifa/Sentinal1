import type { Approval, Release } from "./types";
import { getConnectorBlockers } from "./connectors";

export function calcReadiness(release: Release): number {
  const approvalWeight = 40;
  const ticketWeight = 35;
  const buildWeight = 25;

  const approved = release.approvals.filter((a) => a.status === "Approved").length;
  const approvalScore = (approved / release.approvals.length) * approvalWeight;

  const doneTickets = release.tickets.filter((t) => t.status === "Done").length;
  const ticketScore =
    release.tickets.length === 0
      ? ticketWeight
      : (doneTickets / release.tickets.length) * ticketWeight;

  let buildScore = 0;
  if (release.build.status === "Passed") buildScore = buildWeight;
  else if (release.build.status === "Running") buildScore = buildWeight * 0.5;

  return Math.round(approvalScore + ticketScore + buildScore);
}

export function getBlockers(release: Release): string[] {
  const blockers: string[] = [];
  release.approvals
    .filter((a) => a.status === "Pending")
    .forEach((a) => blockers.push(`Waiting on ${a.gate} sign-off`));
  release.approvals
    .filter((a) => a.status === "Rejected")
    .forEach((a) => blockers.push(`${a.gate} rejected`));
  release.tickets
    .filter((t) => t.status !== "Done")
    .forEach((t) => blockers.push(`Ticket ${t.id} still ${t.status.toLowerCase()}`));
  if (release.build.status === "Failed") blockers.push("Latest build failed");
  if (release.build.status === "Running") blockers.push("Build still running");
  getConnectorBlockers(release).forEach((b) => blockers.push(b.text));
  return blockers;
}

export function hoursPending(approval: Approval): number | null {
  if (!approval.pendingSince || approval.status !== "Pending") return null;
  return Math.round((Date.now() - new Date(approval.pendingSince).getTime()) / 3600000);
}

export function isApprovalOverdue(approval: Approval, typicalHours: number): boolean {
  const h = hoursPending(approval);
  return h !== null && h > typicalHours;
}

export function medianFilesChanged(releases: Release[]): number {
  const sorted = [...releases].map((r) => r.filesChanged).sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

export function getOrgStats(releases: Release[]) {
  const now = new Date();
  const weekAhead = new Date(now);
  weekAhead.setDate(weekAhead.getDate() + 7);

  const thisWeek = releases.filter((r) => {
    const d = new Date(r.targetDate);
    return d >= now && d <= weekAhead && r.status !== "Shipped";
  });

  const avgReadiness =
    releases.length === 0
      ? 0
      : Math.round(releases.reduce((s, r) => s + calcReadiness(r), 0) / releases.length);

  const openBlockers = releases.reduce((s, r) => s + getBlockers(r).length, 0);
  const pendingApprovals = releases.reduce(
    (s, r) => s + r.approvals.filter((a) => a.status === "Pending").length,
    0
  );

  return { thisWeek: thisWeek.length, avgReadiness, openBlockers, pendingApprovals };
}

export function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-AU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getReleaseById(releases: Release[], id: string) {
  return releases.find((r) => r.id === id);
}

export function isFriday(date: Date): boolean {
  return date.getDay() === 5;
}

export function isInFreezeWindow(date: Date, windows: { start: string; end: string }[]): boolean {
  const t = date.getTime();
  return windows.some((w) => {
    const start = new Date(w.start).setHours(0, 0, 0, 0);
    const end = new Date(w.end).setHours(23, 59, 59, 999);
    return t >= start && t <= end;
  });
}

export function getDayConflicts(
  dayReleases: Release[],
  allServices: { id: string; criticality: string }[]
): string[] {
  const warnings: string[] = [];
  const critical = dayReleases.filter((r) =>
    r.dependsOnServices.some((sid) => allServices.find((s) => s.id === sid)?.criticality === "Critical")
  );
  if (critical.length >= 2) {
    warnings.push(`${critical.length} critical-path releases scheduled`);
  }

  const serviceHits: Record<string, number> = {};
  dayReleases.forEach((r) => {
    r.dependsOnServices.forEach((sid) => {
      serviceHits[sid] = (serviceHits[sid] ?? 0) + 1;
    });
  });
  const shared = Object.entries(serviceHits).filter(([, n]) => n >= 2);
  if (shared.length > 0) {
    warnings.push(`${shared.length} shared service conflict${shared.length > 1 ? "s" : ""}`);
  }

  return warnings;
}

export function parseCitations(text: string): { content: string; citations: string[] } {
  const match = text.match(/\n(\*\*)?Sources:(\*\*)?\s*([\s\S]+)$/i);
  if (!match) return { content: text, citations: [] };
  const content = text.replace(/\n(\*\*)?Sources:(\*\*)?\s*[\s\S]+$/i, "").trim();
  const citations = match[3].split(/[,;]/).map((c) => c.trim()).filter(Boolean);
  return { content, citations };
}
