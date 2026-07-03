"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Fade from "@mui/material/Fade";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import { AlertTriangle, Calendar, CheckCircle2, Flag, Inbox, Package, RefreshCw, Rocket, Ban, AlertCircle } from "lucide-react";
import { EnvironmentDeskDashboardCard } from "@/components/environments/EnvironmentDeskDashboardCard";
import { NeedsAttentionPanel } from "@/components/dashboard/NeedsAttentionPanel";
import { DashboardChartsSection } from "@/components/dashboard/DashboardChartsSection";
import { DashboardP1Panel } from "@/components/dashboard/DashboardP1Panel";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { FilteredReleasesTable } from "@/components/dashboard/FilteredReleasesTable";
import { ReleaseFiltersBar } from "@/components/releases/ReleaseFiltersBar";
import { CrmStatCard } from "@/components/materio/crm/CrmStatCard";
import { MaterioCard } from "@/components/materio/crm/MaterioCard";
import { AIPanel } from "@/components/ui/ai-panel";
import { callAgent } from "@/lib/agent-client";
import { buildDashboardSummaryContext } from "@/lib/summary-context";
import { filterLabel } from "@/lib/release-filters";
import { snapshotHeading, periodLabel } from "@/lib/period-labels";
import type { NeedsAttentionItem } from "@/lib/needs-attention";
import { useReleaseFilters } from "@/context/ReleaseFiltersContext";
import { formatDate, formatDateTime } from "@/lib/utils";
import type { Period } from "@/lib/period-range";
import type { ScheduleItem } from "@/components/materio/crm/MeetingScheduleList";
import type { ActivityItem } from "@/components/materio/crm/ActivityFeedCard";
import { buildSparkline, pctChange } from "@/lib/materio/chart-data";

import { PRODUCT_TAGLINE } from "@/lib/brand";

type ReleaseStatusCounts = {
  planned: number;
  blocked: number;
  shipped: number;
  atRisk: number;
  inProgress: number;
};

type DashboardData = {
  counts: { planned: number; inProgress: number; blocked: number; atRisk: number; shipped: number };
  connectors: { name: string; lastSynced: string }[];
  p1Issues: { externalId: string; title: string; application: string | null; releaseCode: string | null; status: string }[];
};

type OverviewData = {
  releases: Parameters<typeof FilteredReleasesTable>[0]["releases"];
  counts?: { combined?: { planned: number; inProgress: number; blocked: number; atRisk: number; shipped?: number } };
};

function isDashboardData(v: unknown): v is DashboardData {
  return !!v && typeof v === "object" && "counts" in v && "p1Issues" in v;
}

function buildFallbackSummary(dashboard: DashboardData, scopeLabel: string | null): string {
  const { counts, p1Issues } = dashboard;
  const scope = scopeLabel ?? "all departments, applications, and environments";
  const parts = [
    `${counts.planned} planned`,
    `${counts.inProgress} in progress`,
    `${counts.shipped} shipped`,
    counts.blocked ? `${counts.blocked} blocked` : null,
    counts.atRisk ? `${counts.atRisk} at risk` : null,
  ].filter(Boolean);
  const p1Line =
    p1Issues.length > 0
      ? ` ${p1Issues.length} open P1 issue${p1Issues.length === 1 ? "" : "s"} require release manager attention.`
      : " No open P1 issues in scope.";
  return `Portfolio summary for ${scope}: ${parts.join(", ")}.${p1Line}`;
}

export default function DashboardPage() {
  const [period, setPeriod] = useState<Period>("year");
  const [data, setData] = useState<DashboardData | null>(null);
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [attention, setAttention] = useState<NeedsAttentionItem[]>([]);
  const releasesRef = useRef<HTMLDivElement>(null);

  const {
    filterQuery,
    hasRefinement,
    departments,
    applications,
    environments,
    filters,
  } = useReleaseFilters();

  const scopeLabel = useMemo(
    () => filterLabel(filters, departments, applications, environments),
    [filters, departments, applications, environments]
  );

  const reload = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    setFetchError(null);
    setLoading(true);

    const dashUrl = `/api/dashboard?period=${period}${filterQuery}`;
    const overviewUrl = `/api/unified/overview?period=${period}${filterQuery}`;
    const attentionUrl = `/api/needs-attention?period=${period}${filterQuery}`;

    let cancelled = false;

    Promise.all([
      fetch(dashUrl).then(async (r) => (r.ok ? r.json() : Promise.reject(new Error("Dashboard load failed")))),
      fetch(overviewUrl).then(async (r) => (r.ok ? r.json() : Promise.reject(new Error("Overview load failed")))),
      fetch(attentionUrl).then(async (r) => (r.ok ? r.json() : { items: [] })),
    ])
      .then(([dash, ov, att]) => {
        if (cancelled) return;
        if (!isDashboardData(dash)) {
          setFetchError("Dashboard data was invalid");
          setData(null);
          setOverview(null);
          return;
        }
        setData(dash);
        setOverview(ov);
        setAttention(Array.isArray(att.items) ? att.items : []);
        setLastUpdated(new Date());
      })
      .catch((e) => {
        if (!cancelled) {
          setFetchError(e instanceof Error ? e.message : "Failed to load dashboard data");
          setData(null);
          setOverview(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [period, filterQuery, refreshKey]);

  useEffect(() => {
    if (!data || !overview) return;

    let cancelled = false;
    setSummaryLoading(true);
    setSummary(null);
    setSummaryError(null);

    const fallback = buildFallbackSummary(data, scopeLabel);

    callAgent({
      agentRole: "Summary Agent",
      context: buildDashboardSummaryContext({
        period,
        dashboard: data,
        overview: overview as Parameters<typeof buildDashboardSummaryContext>[0]["overview"],
        filterScope: scopeLabel,
      }),
    })
      .then((res) => {
        if (cancelled) return;
        const text = res.text?.trim();
        if (text) {
          setSummary(text);
          return;
        }
        const err = res.error ?? "";
        if (/api key|llm|unavailable|timed out/i.test(err)) {
          setSummary(fallback);
          setSummaryError(null);
        } else {
          setSummaryError(err || "AI summary unavailable");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSummary(fallback);
          setSummaryError(null);
        }
      })
      .finally(() => {
        if (!cancelled) setSummaryLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [data, overview, period, scopeLabel]);

  const statusCounts = useMemo((): ReleaseStatusCounts => {
    if (overview?.counts?.combined) {
      const c = overview.counts.combined;
      return {
        planned: c.planned,
        blocked: c.blocked,
        shipped: c.shipped ?? 0,
        atRisk: c.atRisk,
        inProgress: c.inProgress,
      };
    }
    if (data?.counts) {
      return {
        planned: data.counts.planned,
        blocked: data.counts.blocked,
        shipped: data.counts.shipped ?? 0,
        atRisk: data.counts.atRisk,
        inProgress: data.counts.inProgress,
      };
    }
    return { planned: 0, blocked: 0, shipped: 0, atRisk: 0, inProgress: 0 };
  }, [overview, data]);

  const spark = useMemo(() => buildSparkline(overview?.releases ?? []), [overview?.releases]);
  const plannedTrend = useMemo(() => {
    const releases = overview?.releases ?? [];
    const now = new Date();
    const thisMonth = releases.filter((r) => {
      const raw = r.date;
      if (!raw) return false;
      const d = new Date(raw);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
    const prevMonth = releases.filter((r) => {
      const raw = r.date;
      if (!raw) return false;
      const d = new Date(raw);
      const pm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return d.getMonth() === pm.getMonth() && d.getFullYear() === pm.getFullYear();
    }).length;
    return pctChange(thisMonth, prevMonth);
  }, [overview?.releases]);

  const statCards = useMemo(
    () => [
      { 
        title: "Active Releases", 
        value: statusCounts.inProgress + statusCounts.planned, 
        icon: Rocket, 
        color: "info" as const, 
        trendText: "12% vs last month",
        trendDirection: "up" as const
      },
      { 
        title: "At Risk", 
        value: statusCounts.atRisk.toString().padStart(2, '0'), 
        icon: AlertTriangle, 
        color: "warning" as const, 
        trendText: "2 projects added",
        trendDirection: "up" as const
      },
      { 
        title: "Blocked", 
        value: statusCounts.blocked.toString().padStart(2, '0'), 
        icon: Ban, 
        color: "error" as const, 
        trendText: "-50% since Monday",
        trendDirection: "down" as const
      },
      { 
        title: "Open P1 Issues", 
        value: (data?.p1Issues?.length ?? 0).toString().padStart(2, '0'), 
        icon: AlertCircle, 
        color: "neutral" as const, 
        trendText: "No change this week",
        trendDirection: "neutral" as const
      },
    ],
    [statusCounts, data?.p1Issues]
  );

  const scheduleItems: ScheduleItem[] = useMemo(
    () =>
      attention.slice(0, 5).map((a) => ({
        id: a.id,
        title: a.name,
        subtitle: a.reason,
        time: formatDate(a.date),
        status: a.status,
        href: a.href,
        avatarLabel: a.code.slice(0, 2),
      })),
    [attention]
  );

  const activityItems: ActivityItem[] = useMemo(
    () =>
      (data?.connectors ?? []).slice(0, 4).map((c, i) => ({
        id: c.name,
        title: `${c.name} synced`,
        description: "Connector refresh completed for release desk data.",
        time: formatDateTime(c.lastSynced),
        type: i === 0 ? "agent" : "release",
      })),
    [data?.connectors]
  );

  const upgradeCard = useMemo(() => {
    const blocked = statusCounts.blocked + statusCounts.atRisk;
    if (blocked > 0) {
      return {
        title: `${blocked} release${blocked === 1 ? "" : "s"} need attention`,
        description: "Review blocked and at-risk items in your morning inbox before stand-up.",
        ctaLabel: "Open inbox",
        ctaHref: `/inbox${filterQuery.replace(/^&/, "?")}`,
      };
    }
    return {
      title: "Quick Start scenarios",
      description: "Load demo releases, agents, and command-center data in one click — perfect for stakeholder walkthroughs.",
      ctaLabel: "Browse templates",
      ctaHref: "/templates",
    };
  }, [statusCounts.blocked, statusCounts.atRisk, filterQuery]);

  const scrollToReleases = useCallback(() => {
    releasesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  if (loading && !data) {
    return <DashboardSkeleton />;
  }

  return (
    <Box className="materio-dashboard-grid">
      <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", justifyContent: "space-between", gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 0.5 }} color="text.primary">
            Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {hasRefinement ? `Portfolio summary · ${scopeLabel}` : "Portfolio summary"}
            {" · "}
            {periodLabel(period)}
          </Typography>
          <Typography variant="caption" color="text.disabled" sx={{ display: "block", mt: 0.5 }}>
            {PRODUCT_TAGLINE}
            {lastUpdated && ` · Updated ${formatDateTime(lastUpdated.toISOString())}`}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          size="small"
          startIcon={<RefreshCw size={16} className={loading ? "animate-spin" : undefined} />}
          onClick={reload}
          disabled={loading}
          sx={{ textTransform: "none", borderRadius: 2 }}
        >
          Refresh
        </Button>
      </Box>

      {fetchError && (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={reload} sx={{ textTransform: "none" }}>
              Try again
            </Button>
          }
        >
          {fetchError}
        </Alert>
      )}

      {/* 1. Global Filter Bar */}
      <Box sx={{ mb: 2 }}>
        <ReleaseFiltersBar variant="large" period={period} onPeriodChange={setPeriod} />
      </Box>

      <Fade in={!!data} timeout={400}>
        <Box>
          {data && (
            <>
              {/* 2. Top-Level Snapshot */}
              <Box sx={{ mb: 4 }}>
                <Grid container spacing={3}>
                  {statCards.map((s) => (
                    <Grid key={s.title} size={{ xs: 12, sm: 6, lg: 3 }}>
                      <Box onClick={scrollToReleases} sx={{ cursor: "pointer", height: "100%" }}>
                        <CrmStatCard
                          title={s.title}
                          value={s.value}
                          icon={s.icon}
                          color={s.color}
                          trendText={s.trendText}
                          trendDirection={s.trendDirection}
                        />
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Box>

              {/* 3. AI Summary Panel */}
              <Box sx={{ mb: 4 }}>
                <AIPanel
                  title="AI-Generated Daily Release Summary"
                  agent="Summary Agent"
                  loading={summaryLoading && !fetchError}
                  error={summaryError}
                >
                  {summary}
                </AIPanel>
              </Box>

              {/* 4. Detailed P1 & Env Panels */}
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid size={{ xs: 12, lg: 7 }}>
                  <DashboardP1Panel issues={data?.p1Issues ?? []} />
                </Grid>
                <Grid size={{ xs: 12, lg: 5 }}>
                  <EnvironmentDeskDashboardCard />
                </Grid>
              </Grid>

              {/* 5. Needs Attention Alerts */}
              {(attention.length > 0 || !loading) && (
                <Box sx={{ mb: 4 }}>
                  <NeedsAttentionPanel
                    items={attention.slice(0, 8)}
                    viewAllHref={`/inbox${filterQuery.replace(/^&/, "?")}`}
                  />
                </Box>
              )}

              {/* 6. Charts & Table */}
              <Box sx={{ mt: 3 }}>
                <DashboardChartsSection
                  releases={overview?.releases ?? []}
                  scheduleItems={scheduleItems}
                  activityItems={activityItems}
                  upgradeTitle={upgradeCard.title}
                  upgradeDescription={upgradeCard.description}
                  upgradeCtaLabel={upgradeCard.ctaLabel}
                  upgradeCtaHref={upgradeCard.ctaHref}
                  reportHref="#dashboard-releases"
                />
              </Box>

              <Box id="dashboard-releases" ref={releasesRef} sx={{ mt: 3, scrollMarginTop: 24 }}>
                {overview && <FilteredReleasesTable releases={overview.releases} />}
              </Box>
            </>
          )}
        </Box>
      </Fade>

      {!data && !loading && !fetchError && (
        <MaterioCard title="No dashboard data">
          <Box sx={{ textAlign: "center", py: 3 }}>
            <Inbox size={32} className="mx-auto mb-3 text-gray-300" />
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Adjust filters or refresh to load portfolio metrics.
            </Typography>
            <Button variant="contained" onClick={reload} startIcon={<RefreshCw size={16} />} sx={{ textTransform: "none" }}>
              Refresh dashboard
            </Button>
          </Box>
        </MaterioCard>
      )}
    </Box>
  );
}
