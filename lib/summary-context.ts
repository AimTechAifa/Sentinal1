/** Slim context payloads for Summary Agent — avoids huge orgContext + duplicate LLM calls. */

type P1Issue = {
  externalId: string;
  title: string;
  application?: string | null;
  releaseCode?: string | null;
  status: string;
};

type DashboardSlice = {
  counts: { planned: number; inProgress: number; blocked: number; atRisk: number; shipped?: number };
  connectors?: { name: string; lastSynced: string }[];
  p1Issues: P1Issue[];
};

type StatusCounts = {
  planned?: number;
  inProgress?: number;
  blocked?: number;
  atRisk?: number;
  total?: number;
};

type OverviewSlice = {
  counts?: {
    combined: StatusCounts;
    database: StatusCounts;
    demo: StatusCounts;
  };
  releases?: {
    code: string;
    name: string;
    status: string;
    group: string;
    source: string;
    priority?: string;
  }[];
  demoPortfolio?: { totalDemoReleases: number; inPeriod: number; atRisk?: number; blocked?: number };
  environment?: { driftApps: number; bookedEnvs: number; applications: number };
  p1Issues?: P1Issue[];
};

export function buildDashboardSummaryContext(params: {
  period: string;
  dashboard: DashboardSlice;
  overview: OverviewSlice;
  filterScope?: string | null;
}) {
  const { period, dashboard, overview, filterScope } = params;
  const p1Issues = (dashboard.p1Issues.length ? dashboard.p1Issues : overview.p1Issues ?? []).slice(0, 8);

  return {
    period,
    filterScope: filterScope ?? "All departments, applications, and environments",
    portfolio: overview.counts?.combined ?? dashboard.counts,
    databaseCounts: overview.counts?.database,
    demoCounts: overview.counts?.demo,
    demoPortfolio: overview.demoPortfolio,
    environment: overview.environment,
    p1Issues: p1Issues.map((i) => ({
      id: i.externalId,
      title: i.title,
      application: i.application,
      release: i.releaseCode,
      status: i.status,
    })),
    releases: (overview.releases ?? []).slice(0, 12).map((r) => ({
      version: r.code,
      name: r.name,
      status: r.status,
      team: r.group,
      source: r.source,
      priority: r.priority,
    })),
    connectors: (dashboard.connectors ?? []).map((c) => ({ name: c.name, lastSynced: c.lastSynced })),
  };
}

export function buildEnvironmentDeskSummaryContext(desk: {
  stats: { activeReleases: number; bookedEnvs: number; driftApps: number; mappingEdges: number };
  alerts: { severity: string; title: string; detail: string }[];
  timeline: { name: string; status: string; department: string; owner?: string }[];
  bookings: { system: string; month: string; status: string; team?: string; purpose?: string }[];
  versionMatrix: { application: string; dev: string; test: string; prod: string; drift: boolean }[];
}) {
  return {
    stats: desk.stats,
    alerts: desk.alerts.slice(0, 6).map((a) => ({ severity: a.severity, title: a.title, detail: a.detail })),
    upcomingReleases: desk.timeline.slice(0, 8).map((t) => ({
      name: t.name,
      status: t.status,
      department: t.department,
      owner: t.owner,
    })),
    bookings: desk.bookings.slice(0, 8).map((b) => ({
      system: b.system,
      month: b.month,
      status: b.status,
      team: b.team,
      purpose: b.purpose,
    })),
    versionDrift: desk.versionMatrix.filter((v) => v.drift).slice(0, 8).map((v) => ({
      application: v.application,
      dev: v.dev,
      test: v.test,
      prod: v.prod,
    })),
  };
}
