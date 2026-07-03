import type { Release, Service } from "./types";
import { calcReadiness, getBlockers } from "./utils";
import { predictRelease } from "./predictive";

export type ServiceRiskStatus = "healthy" | "warning" | "critical";

export interface ServiceReleaseTouch {
  releaseId: string;
  version: string;
  team: string;
  status: Release["status"];
  readiness: number;
  blockers: number;
}

export interface ServiceDetailView {
  service: Service;
  riskStatus: ServiceRiskStatus;
  riskSummary: string;
  releasesTouching: ServiceReleaseTouch[];
  dependents: Service[];
  upstream: Service[];
}

export function getServiceRiskStatus(service: Service, touching: Release[]): ServiceRiskStatus {
  if (service.unstable || service.criticality === "Critical" && touching.some((r) => r.status === "At Risk")) {
    return "critical";
  }
  if (
    service.recentIncidents.length > 0 ||
    touching.some((r) => r.status === "At Risk" || r.status === "Blocked")
  ) {
    return "warning";
  }
  return "healthy";
}

export function buildServiceDetail(
  serviceId: string,
  allServices: Service[],
  allReleases: Release[]
): ServiceDetailView | null {
  const service = allServices.find((s) => s.id === serviceId);
  if (!service) return null;

  const touching = allReleases.filter((r) => r.dependsOnServices.includes(serviceId));
  const riskStatus = getServiceRiskStatus(service, touching);

  const riskSummary =
    riskStatus === "critical"
      ? `${service.name} is ${service.criticality} with active release risk or instability flag`
      : riskStatus === "warning"
        ? `${service.name} has recent incidents or releases at risk in flight`
        : `${service.name} is stable — no elevated release risk`;

  return {
    service,
    riskStatus,
    riskSummary,
    releasesTouching: touching
      .sort((a, b) => new Date(b.targetDate).getTime() - new Date(a.targetDate).getTime())
      .slice(0, 8)
      .map((r) => ({
        releaseId: r.id,
        version: r.version,
        team: r.team,
        status: r.status,
        readiness: calcReadiness(r),
        blockers: getBlockers(r).length,
      })),
    dependents: allServices.filter((s) => s.dependsOn.includes(serviceId)),
    upstream: allServices.filter((s) => service.dependsOn.includes(s.id)),
  };
}

export function getServiceMlHint(serviceId: string, releases: Release[], unstableIds: Set<string>) {
  const touching = releases.filter((r) => r.dependsOnServices.includes(serviceId));
  if (touching.length === 0) return null;
  const worst = touching
    .map((r) => predictRelease(r, unstableIds))
    .sort((a, b) => a.shipSuccessPct - b.shipSuccessPct)[0];
  return worst;
}
