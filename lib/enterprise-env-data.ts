import { buildEnvironmentPromotions } from "./environment-promotions";
import { connectors, freezeWindows, releases, services } from "./dummy-data";
import { alignVersionsPostRemediation, hasVersionDrift } from "@/lib/environment-drift";
import type {
  ApplicationConfig,
  ApplicationEnvConfig,
  ApplicationVersionRow,
  EnterpriseDepartment,
  EnterpriseEnvStage,
  EnterpriseImpactCondition,
  EnterpriseReleaseImpact,
  EnterpriseSystemNode,
  EnvBooking,
  EnvBookingConflict,
  EnvironmentDeskAlert,
  EnvironmentDeskSnapshot,
  EnvironmentDeskStats,
  Release,
  ReleaseImpact,
  ReleaseSize,
  ReleaseTimelineEntry,
  Service,
  TimelineFreezeOverlay,
} from "./types";

const TEAM_DEPARTMENT: Record<string, EnterpriseDepartment> = {
  Billing: "FIN",
  Payments: "FIN",
  Platform: "Platform",
  Identity: "Security",
  Search: "CRM",
  Mobile: "CRM",
  Core: "Platform",
  Data: "Operations",
  HR: "HR",
};

const TEAM_SYSTEM: Record<string, string> = {
  Platform: "SAP",
  Billing: "FIN",
  Payments: "FIN",
  Search: "CRM",
  Mobile: "CRM",
  Identity: "Security Core",
  Core: "SAP",
  Data: "Oracle",
};

const TEAM_APP: Record<string, string> = {
  Platform: "SAP",
  Billing: "FIN",
  Payments: "FIN",
  Search: "CRM",
  Mobile: "CRM",
  Identity: "Security Core",
  Core: "Core Banking",
  Data: "Oracle",
};

const CRITICAL_SERVICES = new Set(services.filter((s) => s.criticality === "Critical").map((s) => s.id));

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUNE", "JULY", "AUG", "SEP", "OCT", "NOV", "DEC"];

function deptForTeam(team: string): EnterpriseDepartment {
  return TEAM_DEPARTMENT[team] ?? "Operations";
}

function sizeForRelease(r: Release): ReleaseSize {
  if (r.filesChanged > 800 || r.status === "Blocked") return "high";
  if (r.filesChanged > 250) return "medium";
  return "low";
}

function impactForRelease(r: Release): ReleaseImpact {
  const touchesCritical = r.dependsOnServices.some((id) => CRITICAL_SERVICES.has(id));
  if (r.status === "Blocked" || (touchesCritical && r.status === "At Risk")) return "high";
  if (touchesCritical || r.changeRecord?.riskTier === "High") return "medium";
  return "low";
}

function durationDays(size: ReleaseSize): number {
  if (size === "high") return 14;
  if (size === "medium") return 7;
  return 4;
}

function addDays(iso: string, days: number): string {
  return new Date(new Date(iso).getTime() + days * 86400000).toISOString();
}

function monthLabel(d: Date): string {
  return MONTHS[d.getMonth()] ?? d.toLocaleString("en-AU", { month: "short" }).toUpperCase();
}

function envStageFromDeployment(env?: string): EnterpriseEnvStage {
  if (!env) return "DEV";
  const e = env.toLowerCase();
  if (e.includes("prod")) return "PROD";
  if (e.includes("uat")) return "UAT";
  if (e.includes("stag") || e.includes("test")) return "TEST";
  return "DEV";
}

function impactConditions(r: Release): EnterpriseImpactCondition[] {
  const tier = r.changeRecord?.riskTier;
  if (tier === "Critical") return ["queues paused", "events paused", "DB freezes", "apps down", "customer support down"];
  if (tier === "High") return ["queues paused", "events paused", "DB freezes", "apps down"];
  if (tier === "Medium") return ["queues paused", "events paused"];
  if (r.filesChanged > 600) return ["queues paused", "events paused"];
  return ["events paused"];
}

function freezeForDate(iso: string) {
  const d = new Date(iso);
  return freezeWindows.find((fw) => d >= new Date(fw.start) && d <= new Date(fw.end));
}

export function buildReleaseTimeline(source: Release[] = releases): ReleaseTimelineEntry[] {
  const horizon = Date.now() + 120 * 86400000;
  const windowStart = Date.now() - 14 * 86400000;

  return source
    .filter((r) => {
      const t = new Date(r.targetDate).getTime();
      return r.status !== "Shipped" && t >= windowStart && t <= horizon;
    })
    .sort((a, b) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime())
    .slice(0, 12)
    .map((r) => {
      const size = sizeForRelease(r);
      const span = durationDays(size);
      const fw = freezeForDate(r.targetDate);
      return {
        id: `tl-${r.id}`,
        name: r.name,
        department: deptForTeam(r.team),
        size,
        impact: impactForRelease(r),
        startDate: addDays(r.targetDate, -span),
        endDate: addDays(r.targetDate, 2),
        status: r.status,
        releaseId: r.id,
        version: r.version,
        owner: r.owner,
        inFreezeWindow: !!fw,
        freezeWindowName: fw?.name,
      };
    });
}

export function buildFreezeOverlays(): TimelineFreezeOverlay[] {
  return freezeWindows.map((fw) => ({
    id: fw.id,
    name: fw.name,
    startDate: fw.start,
    endDate: fw.end,
    reason: fw.reason,
  }));
}

export function buildEnvBookings(source: Release[] = releases): EnvBooking[] {
  const now = new Date();
  const systems = ["SAP", "FIN", "Oracle", "CRM"];
  const rows: EnvBooking[] = [];

  for (let m = 0; m < 5; m++) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() + m, 1);
    const monthIdx = monthDate.getMonth();
    const label = monthLabel(monthDate);

    for (const system of systems) {
      const matches = source.filter((r) => {
        if (r.status === "Shipped" || TEAM_SYSTEM[r.team] !== system) return false;
        const td = new Date(r.targetDate);
        return td.getMonth() === monthIdx && td.getFullYear() === monthDate.getFullYear();
      });

      const match = matches[0];
      const maint = m === 2 && system === "Oracle";

      rows.push({
        id: `bk-${system.toLowerCase()}-${label}`,
        system,
        month: label,
        monthIndex: monthIdx,
        status: maint ? "MAINTENANCE" : match ? "BOOKED" : "IDLE",
        team: match?.team,
        purpose: match ? `${match.name} (${match.version})` : undefined,
        contact: match?.owner,
        releaseId: match?.id,
        version: match?.version,
        conflict: matches.length > 1,
        conflictCount: matches.length > 1 ? matches.length : undefined,
      });
    }
  }

  return rows;
}

export function buildBookingConflicts(source: Release[] = releases): EnvBookingConflict[] {
  const now = new Date();
  const conflicts: EnvBookingConflict[] = [];
  const systems = ["SAP", "FIN", "Oracle", "CRM"];

  for (let m = 0; m < 5; m++) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() + m, 1);
    const monthIdx = monthDate.getMonth();
    const label = monthLabel(monthDate);

    for (const system of systems) {
      const matches = source.filter((r) => {
        if (r.status === "Shipped" || TEAM_SYSTEM[r.team] !== system) return false;
        const td = new Date(r.targetDate);
        return td.getMonth() === monthIdx && td.getFullYear() === monthDate.getFullYear();
      });
      if (matches.length > 1) {
        conflicts.push({
          id: `conflict-${system}-${label}`,
          system,
          month: label,
          releaseIds: matches.map((r) => r.id),
          teams: matches.map((r) => r.team),
        });
      }
    }
  }

  return conflicts;
}

export function buildSystemMapping(source: Service[] = services): EnterpriseSystemNode[] {
  const gateway = source.find((s) => s.id === "svc-gateway") ?? source[0];
  const payments = source.find((s) => s.id === "svc-payments");
  const billing = source.find((s) => s.id === "svc-billing");
  const search = source.find((s) => s.id === "svc-search");
  const ledger = source.find((s) => s.id === "svc-ledger");
  const mobile = source.find((s) => s.id === "svc-mobile");

  const svcStatus = (s: Service): EnterpriseSystemNode["status"] => {
    if (s.unstable || s.recentIncidents.some((i) => i.severity === "Sev-1")) return "critical";
    if (s.criticality === "Critical" && s.recentIncidents.length > 0) return "warning";
    return "healthy";
  };

  const latestForService = (serviceId: string): string | undefined => {
    const rel = releases.find((r) => r.dependsOnServices.includes(serviceId) && r.status !== "Shipped");
    return rel?.version;
  };

  const nodes: EnterpriseSystemNode[] = [
    {
      id: "env-test-sap",
      label: "TEST SAP",
      type: "environment",
      serviceId: gateway?.id,
      status: gateway ? svcStatus(gateway) : "healthy",
      version: latestForService(gateway?.id ?? ""),
      criticality: gateway?.criticality,
    },
    {
      id: "env-uat-asset",
      label: "UAT Asset Mgmt",
      type: "environment",
      parentId: "env-test-sap",
      serviceId: billing?.id,
      status: billing ? svcStatus(billing) : "healthy",
      version: latestForService(billing?.id ?? ""),
      criticality: billing?.criticality,
    },
    {
      id: "env-dev-oracle",
      label: "DEV Oracle",
      type: "environment",
      parentId: "env-test-sap",
      serviceId: ledger?.id,
      status: ledger ? svcStatus(ledger) : "healthy",
      version: latestForService(ledger?.id ?? ""),
      criticality: ledger?.criticality,
    },
    {
      id: "env-prod-sap",
      label: "PROD SAP",
      type: "environment",
      serviceId: payments?.id,
      status: payments ? svcStatus(payments) : "healthy",
      version: releases.find((r) => r.status === "Shipped" && r.dependsOnServices.includes("svc-payments"))?.version,
      criticality: payments?.criticality,
    },
    {
      id: "app-fin",
      label: "FIN Application",
      type: "application",
      parentId: "env-uat-asset",
      serviceId: billing?.id,
      status: billing ? svcStatus(billing) : "healthy",
      version: latestForService(billing?.id ?? ""),
    },
    {
      id: "app-crm",
      label: "CRM Application",
      type: "application",
      parentId: "env-dev-oracle",
      serviceId: search?.id,
      status: search ? svcStatus(search) : "healthy",
      version: latestForService(search?.id ?? ""),
    },
    {
      id: "app-mobile",
      label: "Mobile BFF",
      type: "application",
      parentId: "env-prod-sap",
      serviceId: mobile?.id,
      status: mobile ? svcStatus(mobile) : "healthy",
      version: latestForService(mobile?.id ?? ""),
    },
  ];

  return nodes;
}

export function buildApplicationVersions(source: Release[] = releases): ApplicationVersionRow[] {
  const apps = new Map<string, { team: string; release: Release; services: string[] }>();

  for (const r of source) {
    const app = TEAM_APP[r.team] ?? r.team;
    const existing = apps.get(app);
    if (!existing || new Date(r.targetDate) > new Date(existing.release.targetDate)) {
      apps.set(app, {
        team: r.team,
        release: r,
        services: r.dependsOnServices,
      });
    }
  }

  return Array.from(apps.entries()).map(([application, { team, release, services: svcIds }]) => {
    const promos = buildEnvironmentPromotions(release).filter((p) => p.region === "ap-southeast-2");
    const devRaw = promos.find((p) => p.environment === "dev")?.version ?? release.version;
    const testRaw = promos.find((p) => p.environment === "staging")?.version ?? devRaw;
    const prodRaw = promos.find((p) => p.environment === "prod")?.version ?? testRaw;
    const { dev, test, prod, promotionPct } = alignVersionsPostRemediation(devRaw, testRaw, prodRaw);
    const drift = hasVersionDrift(dev, test, prod);

    return {
      application,
      dev,
      test,
      prod,
      serviceIds: svcIds,
      drift,
      releaseId: release.id,
      team,
      promotionPct,
    };
  });
}

export function buildApplicationEnvConfigs(source: Release[] = releases): ApplicationEnvConfig[] {
  const configs: ApplicationEnvConfig[] = [];
  const seen = new Set<string>();

  for (const r of source) {
    if (!r.deployment) continue;
    const app = TEAM_APP[r.team] ?? r.team;
    const stage = envStageFromDeployment(r.deployment.environment);
    const key = `${app}-${stage}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const firewall =
      r.approvals.some((a) => a.gate === "Security" && a.status === "Pending")
        ? "Security review pending — restricted ingress"
        : stage === "PROD"
          ? "Deny all except approved CIDRs"
          : stage === "TEST" || stage === "UAT"
            ? "Restricted — test subnet only"
            : "Allow 443 inbound from corp VPN";

    configs.push({
      application: app,
      environment: stage,
      infra: `${r.deployment.cluster} · ${r.deployment.pipeline} · ns/${r.deployment.targetNamespace}`,
      firewall,
      networkZone: stage === "PROD" ? "Production" : stage === "UAT" ? "Internal-UAT" : stage === "TEST" ? "Internal-Test" : "DMZ-Dev",
      lastUpdated: r.build.lastRun,
    });
  }

  return configs.sort((a, b) => a.application.localeCompare(b.application));
}

export function buildApplicationConfigs(source: Release[] = releases): ApplicationConfig[] {
  const flagConnector = connectors.find((c) => c.category === "Feature Flags");
  const apps = new Map<string, Release>();

  for (const r of source) {
    const app = TEAM_APP[r.team] ?? r.team;
    const existing = apps.get(app);
    if (!existing || new Date(r.build.lastRun) > new Date(existing.build.lastRun)) {
      apps.set(app, r);
    }
  }

  return Array.from(apps.entries()).map(([application, r]) => {
    const slug = application.toLowerCase().replace(/\s+/g, "-");
    const stage = envStageFromDeployment(r.deployment?.environment);
    const openFlags = r.tickets.filter((t) => t.status !== "Done").length;

    return {
      application,
      baseUrl: `https://${slug}-${stage.toLowerCase()}.corp.example.com`,
      apiUrl: `https://${slug}-api-${stage.toLowerCase()}.corp.example.com`,
      featureFlags: [
        {
          name: `${slug}-rollout`,
          enabled: r.status === "Ready" || r.status === "Shipped",
          environment: stage,
        },
        {
          name: `${slug}-dark-launch`,
          enabled: r.build.status === "Passed",
          environment: "DEV" as EnterpriseEnvStage,
        },
        {
          name: flagConnector ? "launchdarkly-sync" : "local-flags",
          enabled: !!flagConnector && flagConnector.status === "Connected",
          environment: stage,
        },
        {
          name: `${slug}-canary`,
          enabled: openFlags === 0 && r.build.status === "Passed",
          environment: stage,
        },
      ],
      lastUpdated: r.build.lastRun,
    };
  });
}

export function buildEnterpriseImpacts(source: Release[] = releases): EnterpriseReleaseImpact[] {
  const now = Date.now();

  return source
    .filter((r) => r.changeRecord || r.status === "At Risk" || r.status === "Blocked")
    .slice(0, 6)
    .map((r) => {
      const start = r.changeRecord ? new Date(r.changeRecord.scheduledStart).getTime() : new Date(r.targetDate).getTime();
      const active = Math.abs(now - start) < 2 * 86400000 && r.status !== "Shipped";

      const prerequisites: string[] = [];
      if (r.changeRecord) prerequisites.push(`Change record ${r.changeRecord.crNumber} — ${r.changeRecord.cabStatus}`);
      if (r.approvals.some((a) => a.status === "Pending")) {
        prerequisites.push(`${r.approvals.filter((a) => a.status === "Pending").length} approval gates pending`);
      }
      r.dependsOnServices.slice(0, 2).forEach((sid) => {
        const svc = services.find((s) => s.id === sid);
        if (svc) prerequisites.push(`${svc.name} must be stable (${svc.criticality})`);
      });
      freezeWindows.forEach((fw) => {
        const td = new Date(r.targetDate);
        if (td >= new Date(fw.start) && td <= new Date(fw.end)) {
          prerequisites.push(`Avoids freeze: ${fw.name}`);
        }
      });
      if (prerequisites.length === 0) prerequisites.push("Standard pre-release checklist complete");

      return {
        releaseId: r.id,
        releaseName: r.name,
        version: r.version,
        prerequisites,
        conditions: impactConditions(r),
        active,
      };
    });
}

export function buildEnvironmentDeskAlerts(
  snapshot: Omit<EnvironmentDeskSnapshot, "alerts" | "stats">
): EnvironmentDeskAlert[] {
  const alerts: EnvironmentDeskAlert[] = [];

  snapshot.bookingConflicts.forEach((c) => {
    alerts.push({
      id: c.id,
      severity: "high",
      title: `${c.system} double-booked in ${c.month}`,
      detail: `${c.teams.join(" vs ")} — ${c.releaseIds.length} releases competing for the same environment window.`,
      href: "/environments",
      actionLabel: "Review booking",
    });
  });

  snapshot.versions
    .filter((v) => v.drift)
    .forEach((v) => {
      alerts.push({
        id: `drift-${v.application}`,
        severity: "medium",
        title: `${v.application} version drift`,
        detail: `PROD ${v.prod} lags TEST ${v.test} / DEV ${v.dev} — promotion at ${v.promotionPct}%.`,
        href: v.releaseId ? `/releases/${v.releaseId}` : "/environments",
        actionLabel: "Promote",
      });
    });

  snapshot.systemNodes
    .filter((n) => n.status === "critical" || n.status === "warning")
    .forEach((n) => {
      alerts.push({
        id: `health-${n.id}`,
        severity: n.status === "critical" ? "high" : "medium",
        title: `${n.label} ${n.status}`,
        detail: n.serviceId
          ? `Mapped service ${n.serviceId} has recent incidents or instability.`
          : "Environment node reporting degraded health.",
        href: "/environments",
        actionLabel: "Inspect map",
      });
    });

  snapshot.impacts
    .filter((i) => i.active)
    .forEach((i) => {
      alerts.push({
        id: `impact-${i.releaseId}`,
        severity: "high",
        title: `Active impact: ${i.releaseName}`,
        detail: i.conditions.join(", "),
        href: `/releases/${i.releaseId}`,
        actionLabel: "View release",
      });
    });

  snapshot.timeline
    .filter((t) => t.inFreezeWindow)
    .forEach((t) => {
      alerts.push({
        id: `freeze-${t.id}`,
        severity: "medium",
        title: `${t.name} overlaps freeze window`,
        detail: t.freezeWindowName ?? "Release target date falls inside a change freeze.",
        href: t.releaseId ? `/releases/${t.releaseId}` : "/calendar?month=freeze",
        actionLabel: "Reschedule?",
      });
    });

  return alerts.sort((a, b) => {
    const rank = { high: 0, medium: 1, low: 2 };
    return rank[a.severity] - rank[b.severity];
  });
}

export function getEnvironmentDeskContext(snapshot: EnvironmentDeskSnapshot) {
  return {
    stats: snapshot.stats,
    alerts: snapshot.alerts.slice(0, 6).map((a) => ({ title: a.title, detail: a.detail, severity: a.severity })),
    driftApps: snapshot.versions.filter((v) => v.drift).map((v) => v.application),
    bookingConflicts: snapshot.bookingConflicts,
    activeImpacts: snapshot.impacts.filter((i) => i.active).map((i) => i.releaseName),
    freezeWindows: snapshot.freezeOverlays.map((f) => f.name),
  };
}

export function buildEnvironmentDeskStats(snapshot: Omit<EnvironmentDeskSnapshot, "stats">): EnvironmentDeskStats {
  return {
    timelineCount: snapshot.timeline.length,
    bookedEnvs: snapshot.bookings.filter((b) => b.status === "BOOKED").length,
    versionDrift: snapshot.versions.filter((v) => v.drift).length,
    activeImpacts: snapshot.impacts.filter((i) => i.active).length,
    mappedServices: snapshot.systemNodes.filter((n) => n.serviceId).length,
    promotionGap: snapshot.versions.filter((v) => v.promotionPct < 100).length,
    bookingConflicts: snapshot.bookingConflicts.length,
    unhealthyServices: snapshot.systemNodes.filter((n) => n.status !== "healthy").length,
    releasesInFreeze: snapshot.timeline.filter((t) => t.inFreezeWindow).length,
  };
}

export function buildEnvironmentDesk(
  sourceReleases: Release[] = releases,
  sourceServices: Service[] = services
): EnvironmentDeskSnapshot {
  const timeline = buildReleaseTimeline(sourceReleases);
  const bookings = buildEnvBookings(sourceReleases);
  const bookingConflicts = buildBookingConflicts(sourceReleases);
  const freezeOverlays = buildFreezeOverlays();
  const systemNodes = buildSystemMapping(sourceServices);
  const versions = buildApplicationVersions(sourceReleases);
  const envConfigs = buildApplicationEnvConfigs(sourceReleases);
  const appConfigs = buildApplicationConfigs(sourceReleases);
  const impacts = buildEnterpriseImpacts(sourceReleases);

  const partial = {
    timeline,
    bookings,
    bookingConflicts,
    freezeOverlays,
    systemNodes,
    versions,
    envConfigs,
    appConfigs,
    impacts,
    alerts: [] as EnvironmentDeskAlert[],
  };
  partial.alerts = buildEnvironmentDeskAlerts(partial);
  return { ...partial, stats: buildEnvironmentDeskStats(partial) };
}

/** @deprecated Use buildEnvironmentDesk() — kept for static re-exports */
export const releaseTimeline = buildReleaseTimeline();
export const envBookings = buildEnvBookings();
export const enterpriseSystemNodes = buildSystemMapping();
export const applicationVersions = buildApplicationVersions();
export const applicationEnvConfigs = buildApplicationEnvConfigs();
export const applicationConfigs = buildApplicationConfigs();
export const enterpriseReleaseImpacts = buildEnterpriseImpacts();
export const ENTERPRISE_SYSTEMS = ["SAP", "Oracle", "FIN", "CRM"] as const;

export const environmentDesk = buildEnvironmentDesk();
