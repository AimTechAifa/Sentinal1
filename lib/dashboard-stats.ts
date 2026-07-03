import type { Release } from "./types";
import { getOrgStats } from "./utils";
import type { ReleaseStoreState } from "./release-store";
import { unreadCount } from "./release-store";

export function getLiveDashboardStats(releases: Release[], state: ReleaseStoreState) {
  const base = getOrgStats(releases);
  const recordedDecisions = Object.keys(state.decisions).length;
  const activeDeploys = Object.values(state.deployments).filter((d) =>
    ["In Progress", "Verifying"].includes(d.phase)
  ).length;

  return {
    ...base,
    recordedDecisions,
    activeDeploys,
    unreadAlerts: unreadCount(state),
  };
}
