import { connectors } from "./dummy-data";
import type { Release } from "./types";

export function connectorSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function getConnectorIssues() {
  return connectors.filter((c) => c.status === "Error" || c.status === "Disconnected");
}

export function getConnectorBlockers(release: Release): { text: string; href?: string }[] {
  const items: { text: string; href?: string }[] = [];
  const securityPending = release.approvals.some((a) => a.gate === "Security" && a.status === "Pending");
  const checkmarx = connectors.find((c) => c.id === "c23");

  if (securityPending && checkmarx?.status === "Error") {
    items.push({
      text: "Checkmarx sync failed — Security scans stale",
      href: `/connectors?filter=issues#${connectorSlug(checkmarx.name)}`,
    });
  }

  const snyk = connectors.find((c) => c.id === "c5");
  if (securityPending && snyk && release.id === "rel-v2140") {
    items.push({
      text: "3 critical Snyk vulns open — review Security Agent findings",
      href: `/connectors?filter=issues#${connectorSlug(snyk.name)}`,
    });
  }

  if (release.build.status === "Failed") {
    items.push({
      text: "CI pipeline failed — verify GitHub Actions / Jenkins sync",
      href: "/connectors?filter=issues",
    });
  }

  return items;
}
