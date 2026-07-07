"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar, LineChart, Line,
  ResponsiveContainer, XAxis, YAxis, Tooltip,
} from "recharts";
import {
  AlertTriangle, Ban, CheckCircle2, Clock, Server, GitBranch,
  Users, Activity, ShieldAlert, Wrench, ArrowUpRight, Rocket,
  TrendingUp, TrendingDown, Zap, ChevronRight, Sparkles, ArrowRight,
  Minus, RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { useThemeMode } from "@/context/ThemeModeContext";
import { DASHBOARD_PERIOD_OPTIONS, type DashboardPeriod } from "@/lib/dashboard-period";

type Tone = "rose" | "amber" | "emerald" | "indigo" | "violet" | "sky";
type TopIssueSeverity = "rose" | "amber" | "sky";
type TopIssueIcon = "Ban" | "ShieldAlert" | "Clock" | "Server" | "Users";

const TONES: Record<Tone, { wash: string; chip: string; text: string; dot: string; line: string }> = {
  rose: {
    wash: "from-rose-50 to-rose-100/60 dark:from-rose-950/45 dark:to-rose-900/25",
    chip: "bg-rose-500",
    text: "text-rose-600 dark:text-rose-400",
    dot: "#f43f5e",
    line: "#f43f5e",
  },
  amber: {
    wash: "from-amber-50 to-orange-100/60 dark:from-amber-950/45 dark:to-orange-900/25",
    chip: "bg-amber-500",
    text: "text-amber-600 dark:text-amber-400",
    dot: "#f59e0b",
    line: "#f59e0b",
  },
  emerald: {
    wash: "from-emerald-50 to-teal-100/60 dark:from-emerald-950/45 dark:to-teal-900/25",
    chip: "bg-emerald-500",
    text: "text-emerald-600 dark:text-emerald-400",
    dot: "#10b981",
    line: "#10b981",
  },
  indigo: {
    wash: "from-indigo-50 to-blue-100/60 dark:from-indigo-950/45 dark:to-blue-900/25",
    chip: "bg-indigo-500",
    text: "text-indigo-600 dark:text-indigo-400",
    dot: "#6366f1",
    line: "#6366f1",
  },
  violet: {
    wash: "from-violet-50 to-purple-100/60 dark:from-violet-950/45 dark:to-purple-900/25",
    chip: "bg-violet-500",
    text: "text-violet-600 dark:text-violet-400",
    dot: "#8b5cf6",
    line: "#8b5cf6",
  },
  sky: {
    wash: "from-sky-50 to-cyan-100/60 dark:from-sky-950/45 dark:to-cyan-900/25",
    chip: "bg-sky-500",
    text: "text-sky-600 dark:text-sky-400",
    dot: "#0ea5e9",
    line: "#0ea5e9",
  },
};

const SEV_STYLE: Record<TopIssueSeverity, { bg: string; ring: string; text: string; dot: string; label: string }> = {
  rose: {
    bg: "bg-rose-50 dark:bg-rose-950/35",
    ring: "ring-rose-100 dark:ring-rose-900/50",
    text: "text-rose-600 dark:text-rose-400",
    dot: "#f43f5e",
    label: "Critical",
  },
  amber: {
    bg: "bg-amber-50 dark:bg-amber-950/35",
    ring: "ring-amber-100 dark:ring-amber-900/50",
    text: "text-amber-600 dark:text-amber-400",
    dot: "#f59e0b",
    label: "Attention",
  },
  sky: {
    bg: "bg-sky-50 dark:bg-sky-950/35",
    ring: "ring-sky-100 dark:ring-sky-900/50",
    text: "text-sky-600 dark:text-sky-400",
    dot: "#0ea5e9",
    label: "Heads up",
  },
};

const ISSUE_ICONS: Record<TopIssueIcon, typeof Ban> = {
  Ban,
  ShieldAlert,
  Clock,
  Server,
  Users,
};

const PIPELINE_ICONS: Record<string, typeof Rocket> = {
  "Total Releases": Rocket,
  "Blocked": Ban,
  "Pending CAB": Clock,
  "In Testing": Activity,
  "Approved": CheckCircle2,
  "Planning": AlertTriangle,
};

const OPS_ICONS: Record<string, typeof ShieldAlert> = {
  "Active Incidents": ShieldAlert,
  "Critical Alerts": Zap,
  "Env Conflicts": GitBranch,
  "Blocked Deps": GitBranch,
  "Pending Approvals": CheckCircle2,
  "Staff on Leave": Users,
};

const spark = (seed: number) =>
  Array.from({ length: 8 }, (_, i) => ({
    v: Math.max(1, seed + Math.round(Math.sin(i + seed) * 3) + i * (seed % 2 === 0 ? 0.3 : -0.2)),
  }));

type Tile = { label: string; value: number; sub?: string; delta?: number | null; href: string; tone: Tone };

type TopIssue = {
  severity: TopIssueSeverity;
  title: string;
  reason: string;
  meta: string;
  href: string;
  icon: TopIssueIcon;
};

type DashboardPayload = {
  period: DashboardPeriod;
  generatedAt: string;
  hero: { blockedReleases: number; activeP1Incidents: number; appsDownProd: number };
  briefing: string;
  topIssues: TopIssue[];
  pipeline: Tile[];
  ops: Tile[];
  availability: {
    counts: { name: string; value: number; color: string }[];
    percentHealthy: number;
    prod: { healthy: number; total: number };
    total: number;
  };
  incidentTrend: { date: string; count: number }[];
  riskDistribution: { name: string; value: number; color: string }[];
  releaseTrend: { week: string; count: number }[];
  maintenance: { label: string; value: number; href: string }[];
  health: { label: string; status: string }[];
};

const HEALTH_TONE: Record<string, Tone> = { Healthy: "emerald", Warning: "amber", Critical: "rose" };

const INCIDENT_TREND_LABEL: Record<DashboardPeriod, string> = {
  today: "Today by 6-hour blocks",
  week: "Last 7 days",
  month: "Weekly buckets this month",
  all: "Last 12 weeks",
};

const RELEASE_TREND_LABEL: Record<DashboardPeriod, string> = {
  today: "Releases scheduled today",
  week: "Daily release count this week",
  month: "Weekly release count this month",
  all: "Next 4 weeks",
};

function useChartTheme() {
  const { mode } = useThemeMode();
  const isDark = mode === "dark";
  return useMemo(
    () => ({
      tick: isDark ? "#94a3b8" : "#A3AED0",
      cursor: isDark ? "rgba(42, 49, 66, 0.65)" : "#F4F7FE",
      tooltip: {
        borderRadius: 12,
        border: "none",
        boxShadow: isDark
          ? "0 10px 30px -10px rgba(0,0,0,0.55)"
          : "0 10px 30px -10px rgba(112,144,176,.35)",
        fontSize: 12,
        background: isDark ? "#2a3142" : "#ffffff",
        color: isDark ? "#ffffff" : "#1B2559",
      } as React.CSSProperties,
    }),
    [isDark]
  );
}

/* ---------- primitives ---------- */

function Card({
  children,
  className = "",
  accent,
}: {
  children: React.ReactNode;
  className?: string;
  accent?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[24px] bg-white p-6 shadow-[0_18px_40px_-24px_rgba(112,144,176,0.18)]",
        "dark:bg-[var(--card)] dark:shadow-[0_18px_40px_-24px_rgba(0,0,0,0.45)]",
        className
      )}
    >
      {accent && <div className={cn("absolute inset-x-0 top-0 h-[3px]", accent)} />}
      {children}
    </div>
  );
}

function Delta({ value }: { value: number | null | undefined }) {
  if (value === null || value === undefined) return null;
  if (value === 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-slate-400 dark:text-white/45">
        <Minus size={11} /> flat
      </span>
    );
  }
  const up = value > 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-[11px] font-semibold",
        up ? "text-rose-500 dark:text-rose-400" : "text-emerald-500 dark:text-emerald-400"
      )}
    >
      {up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
      {up ? "+" : ""}
      {value} vs yesterday
    </span>
  );
}

function KpiTile({
  label,
  value,
  sub,
  delta,
  href,
  tone,
  icon: Icon,
  onNavigate,
}: Tile & { icon: typeof Rocket; onNavigate: (href: string) => void }) {
  const t = TONES[tone] ?? TONES.indigo;
  const sparkData = spark((value % 9) + 3);
  return (
    <button
      onClick={() => onNavigate(href)}
      className={cn(
        "group relative w-full overflow-hidden rounded-[22px] bg-gradient-to-br p-5 text-left transition-all duration-300",
        "hover:-translate-y-1 hover:shadow-[0_20px_40px_-20px_rgba(112,144,176,0.35)]",
        "focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-200 dark:focus-visible:ring-indigo-500/40",
        t.wash
      )}
    >
      <div className="flex items-start justify-between">
        <span className={cn("flex h-11 w-11 items-center justify-center rounded-2xl text-white shadow-sm", t.chip)}>
          <Icon size={20} strokeWidth={2} />
        </span>
        <ArrowUpRight
          size={17}
          className="text-slate-400 opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:text-slate-600 dark:text-white/40 dark:group-hover:text-white/70"
        />
      </div>

      <div className="mt-4 flex items-end justify-between gap-2">
        <div>
          <div className="text-[32px] font-bold leading-none tracking-tight text-slate-900 tabular-nums dark:text-white">
            {value}
          </div>
          <div className="mt-1.5 text-[13px] font-medium text-slate-500 dark:text-white/60">{label}</div>
        </div>
        <div className="mb-0.5 h-8 w-16 opacity-70">
          <ResponsiveContainer minWidth={0} minHeight={0} width="100%" height="100%">
            <LineChart data={sparkData}>
              <Line type="monotone" dataKey="v" stroke={t.line} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="mt-1.5 flex items-center justify-between">
        {sub ? <span className={cn("text-[11px] font-semibold", t.text)}>{sub}</span> : <span />}
        <Delta value={delta} />
      </div>
    </button>
  );
}

function ChartCard({
  title,
  subtitle,
  badge,
  children,
  href,
  onNavigate,
  accent,
}: {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
  href?: string;
  onNavigate: (href: string) => void;
  accent?: string;
}) {
  return (
    <Card accent={accent}>
      <div className="mb-1 flex items-start justify-between">
        <div>
          <h3 className="text-[15px] font-bold text-slate-800 dark:text-white">{title}</h3>
          {subtitle && <p className="mt-0.5 text-[12px] text-slate-400 dark:text-white/50">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">
          {badge}
          {href && (
            <button
              onClick={() => onNavigate(href)}
              className="flex items-center gap-0.5 text-[12px] font-semibold text-indigo-500 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              View <ChevronRight size={14} />
            </button>
          )}
        </div>
      </div>
      {children}
    </Card>
  );
}

function IssueRow({ issue, onNavigate, compact }: { issue: TopIssue; onNavigate: (href: string) => void; compact?: boolean }) {
  const s = SEV_STYLE[issue.severity];
  const Icon = ISSUE_ICONS[issue.icon];
  return (
    <button
      onClick={() => onNavigate(issue.href)}
      className={cn(
        "group flex w-full items-start text-left ring-1 transition-all",
        "hover:-translate-y-0.5 hover:shadow-md dark:hover:shadow-black/30",
        compact ? "gap-3 rounded-2xl px-3.5 py-4" : "gap-3.5 rounded-2xl p-4",
        s.bg,
        s.ring
      )}
    >
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm dark:bg-white/10 dark:shadow-none">
        <Icon size={16} className={s.text} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-1 rounded-full bg-white px-1.5 py-0.5 text-[9px] font-bold dark:bg-white/10",
              compact ? "text-[10px]" : "text-[10px]",
              s.text
            )}
          >
            <span className="h-1 w-1 rounded-full" style={{ background: s.dot }} />
            {s.label}
          </span>
          <span className={cn("truncate font-bold text-slate-800 dark:text-white", compact ? "text-[13px]" : "text-[13.5px]")}>
            {issue.title}
          </span>
        </div>
        <p className={cn("mt-1 leading-snug text-slate-600 dark:text-white/70", compact ? "line-clamp-2 text-[12px]" : "text-[12.5px]")}>
          {issue.reason}
        </p>
        <p className={cn("mt-1.5 font-medium text-slate-400 dark:text-white/45", compact ? "text-[11px]" : "text-[11px]")}>
          {issue.meta}
        </p>
      </div>
      <ArrowRight
        size={16}
        className="mt-2 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-500 dark:text-white/25 dark:group-hover:text-white/55"
      />
    </button>
  );
}

export default function CommandDashboardContent() {
  const router = useRouter();
  const chartTheme = useChartTheme();
  const [period, setPeriod] = useState<DashboardPeriod>("all");
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const onNavigate = (href: string) => router.push(href);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/dashboard?period=${period}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Failed to load dashboard"))))
      .then((d) => !cancelled && setData(d))
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : "Failed to load dashboard"))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [refreshKey, period]);

  const incidentTrendChart = useMemo(
    () =>
      (data?.incidentTrend ?? []).map((d) => ({
        d: d.date,
        v: d.count,
      })),
    [data?.incidentTrend]
  );

  const incidentTrendChange = useMemo(() => {
    const t = data?.incidentTrend ?? [];
    if (t.length < 2) return null;
    const first = t[0].count;
    const last = t[t.length - 1].count;
    if (first === 0) return last > 0 ? { dir: "up" as const, pct: 100 } : null;
    const pct = Math.round(((last - first) / first) * 100);
    return { dir: pct >= 0 ? ("up" as const) : ("down" as const), pct: Math.abs(pct) };
  }, [data?.incidentTrend]);

  const releaseTrendChart = useMemo(
    () => (data?.releaseTrend ?? []).map((d) => ({ w: d.week, v: d.count })),
    [data?.releaseTrend]
  );

  const releaseTrendDirection = useMemo(() => {
    const t = data?.releaseTrend ?? [];
    if (t.length < 2) return null;
    return t[t.length - 1].count >= t[0].count ? "up" : "down";
  }, [data?.releaseTrend]);

  const issueSeverityMix = useMemo(() => {
    const issues = data?.topIssues ?? [];
    const counts = { Critical: 0, Attention: 0, "Heads up": 0 };
    for (const i of issues) {
      if (i.severity === "rose") counts.Critical++;
      else if (i.severity === "amber") counts.Attention++;
      else counts["Heads up"]++;
    }
    return [
      { name: "Critical", value: counts.Critical, color: "#f43f5e" },
      { name: "Attention", value: counts.Attention, color: "#f59e0b" },
      { name: "Heads up", value: counts["Heads up"], color: "#0ea5e9" },
    ].filter((d) => d.value > 0);
  }, [data?.topIssues]);

  const pipelineSnapshot = useMemo(
    () =>
      (data?.pipeline ?? [])
        .filter((p) => p.label !== "Total Releases")
        .slice(0, 5)
        .map((p) => ({ name: p.label.replace("Pending ", ""), v: p.value, fill: TONES[p.tone].line })),
    [data?.pipeline]
  );

  if (loading && !data) {
    return <DashboardSkeleton />;
  }

  if (error || !data) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 bg-[#F4F7FE] dark:bg-[var(--background)]">
        <p className="text-sm text-gray-500 dark:text-white/60">{error ?? "No dashboard data"}</p>
        <button
          onClick={() => setRefreshKey((k) => k + 1)}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div
      className="-mx-4 -mt-6 min-h-screen px-4 pb-9 pt-6 md:-mx-6 md:px-6 md:pt-9 lg:-mx-8 lg:px-8 bg-[#F4F7FE] dark:bg-[var(--background)]"
      style={{ fontFamily: "'Plus Jakarta Sans','DM Sans',ui-sans-serif,system-ui,sans-serif" }}
    >
      <div className="mx-auto max-w-[1380px]">
        {/* header */}
        <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-[12px] font-semibold text-slate-400 dark:text-white/50">Release Desk / Overview</div>
            <h1 className="mt-0.5 text-[30px] font-bold tracking-tight text-[#1B2559] dark:text-white">
              Command Dashboard
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-2xl bg-white p-1.5 shadow-[0_18px_40px_-24px_rgba(112,144,176,0.25)] dark:bg-[var(--card)] dark:shadow-[0_18px_40px_-24px_rgba(0,0,0,0.4)]">
              {DASHBOARD_PERIOD_OPTIONS.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setPeriod(f.value)}
                  className={cn(
                    "rounded-xl px-4 py-2 text-[13px] font-semibold transition-all",
                    period === f.value
                      ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md"
                      : "text-slate-500 hover:bg-slate-50 dark:text-white/55 dark:hover:bg-white/5"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setRefreshKey((k) => k + 1)}
              className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-500 shadow-[0_18px_40px_-24px_rgba(112,144,176,0.25)] hover:text-slate-700 dark:bg-[var(--card)] dark:text-white/55 dark:hover:text-white/80 dark:shadow-[0_18px_40px_-24px_rgba(0,0,0,0.4)]"
              aria-label="Refresh dashboard"
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </button>
          </div>
        </div>

        {/* HERO */}
        <div className="relative mb-7 overflow-hidden rounded-[28px] bg-gradient-to-r from-[#3E2CBB] via-[#5A3FE0] to-[#7C5CFF] p-7 text-white shadow-[0_30px_60px_-25px_rgba(90,63,224,0.55)]">
          <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 left-1/3 h-56 w-56 rounded-full bg-fuchsia-400/10 blur-3xl" />

          <div className="relative">
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.18em] text-white/60">
                  <Sparkles size={13} /> Needs attention now
                </div>
                <div className="mt-2 flex flex-wrap items-end gap-8">
                  {[
                    { n: data.hero.blockedReleases, l: "Blocked releases", href: "/releases?status=Blocked" },
                    { n: data.hero.activeP1Incidents, l: "P1 incidents", href: "/incidents?severity=P1" },
                    { n: data.hero.appsDownProd, l: "Apps down in Prod", href: "/application-status?status=Down&env=Prod" },
                  ].map((x) => (
                    <button key={x.l} type="button" onClick={() => onNavigate(x.href)} className="group text-left focus:outline-none">
                      <div className="text-[44px] font-bold leading-none tabular-nums transition-transform duration-300 group-hover:scale-105">
                        {x.n}
                      </div>
                      <div className="mt-1 flex items-center gap-1 text-[13px] font-medium text-white/70 group-hover:text-white">
                        {x.l}{" "}
                        <ArrowUpRight size={14} className="opacity-0 transition-opacity group-hover:opacity-100" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="hidden h-24 w-px bg-white/15 md:block" />
              <div className="max-w-[320px] text-[13px] leading-relaxed text-white/80">{data.briefing}</div>
            </div>
          </div>
        </div>

        {/* Needs Your Decision */}
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-[15px] font-bold text-[#1B2559] dark:text-white">Needs Your Decision</h2>
            <p className="text-[12px] text-slate-400 dark:text-white/50">
              Synthesized from blockers, risk, conflicts, approvals and monitoring — ranked by urgency
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate("/inbox")}
            className="flex items-center gap-0.5 text-[12.5px] font-semibold text-indigo-500 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            Full inbox <ChevronRight size={14} />
          </button>
        </div>
        <div className="mb-8 grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(300px,380px)]">
          <Card accent="bg-gradient-to-r from-indigo-500 to-violet-500">
            <div className="space-y-3">
              {data.topIssues.length > 0 ? (
                data.topIssues.map((issue, i) => (
                  <IssueRow key={`${issue.href}-${i}`} issue={issue} onNavigate={onNavigate} compact />
                ))
              ) : (
                <p className="py-6 text-center text-[13px] text-slate-500 dark:text-white/55">
                  No urgent decisions right now — portfolio looks clear.
                </p>
              )}
            </div>
          </Card>

          <div className="grid gap-4">
            <Card accent="bg-rose-400">
              <h3 className="text-[13px] font-bold text-slate-800 dark:text-white">Decision mix</h3>
              <p className="mt-0.5 text-[11px] text-slate-400 dark:text-white/50">By urgency band</p>
              <div className="relative mt-2 h-[150px]">
                {issueSeverityMix.length > 0 ? (
                  <ResponsiveContainer minWidth={0} minHeight={0} width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={issueSeverityMix}
                        dataKey="value"
                        innerRadius={42}
                        outerRadius={62}
                        paddingAngle={3}
                        stroke="none"
                        cornerRadius={4}
                      >
                        {issueSeverityMix.map((e, i) => (
                          <Cell key={i} fill={e.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={chartTheme.tooltip} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-[12px] text-slate-400 dark:text-white/45">
                    No issues
                  </div>
                )}
              </div>
              <div className="mt-1 flex flex-wrap justify-center gap-3">
                {issueSeverityMix.map((e) => (
                  <span key={e.name} className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-white/55">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: e.color }} />
                    {e.name} <strong className="text-slate-700 dark:text-white">{e.value}</strong>
                  </span>
                ))}
              </div>
            </Card>

            <Card accent="bg-indigo-400">
              <h3 className="text-[13px] font-bold text-slate-800 dark:text-white">Pipeline snapshot</h3>
              <p className="mt-0.5 text-[11px] text-slate-400 dark:text-white/50">Key release statuses</p>
              <div className="mt-2 h-[150px]">
                <ResponsiveContainer minWidth={0} minHeight={0} width="100%" height="100%">
                  <BarChart data={pipelineSnapshot} barCategoryGap={10} margin={{ left: -22, right: 4, top: 4, bottom: 0 }}>
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 9, fill: chartTheme.tick }}
                      axisLine={false}
                      tickLine={false}
                      interval={0}
                    />
                    <YAxis tick={{ fontSize: 9, fill: chartTheme.tick }} axisLine={false} tickLine={false} width={22} allowDecimals={false} />
                    <Tooltip cursor={{ fill: chartTheme.cursor }} contentStyle={chartTheme.tooltip} />
                    <Bar dataKey="v" radius={[6, 6, 6, 6]} barSize={18}>
                      {pipelineSnapshot.map((e, i) => (
                        <Cell key={i} fill={e.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </div>

        {/* Release pipeline */}
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[15px] font-bold text-[#1B2559] dark:text-white">Release Pipeline</h2>
          <button
            type="button"
            onClick={() => onNavigate("/releases")}
            className="flex items-center gap-0.5 text-[12.5px] font-semibold text-indigo-500 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            All releases <ChevronRight size={14} />
          </button>
        </div>
        <div className="mb-7 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
          {data.pipeline.map((k) => (
            <KpiTile key={k.label} {...k} icon={PIPELINE_ICONS[k.label] ?? Rocket} onNavigate={onNavigate} />
          ))}
        </div>

        {/* Ops KPIs */}
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[15px] font-bold text-[#1B2559] dark:text-white">Operations &amp; Environments</h2>
        </div>
        <div className="mb-7 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
          {data.ops.map((k) => (
            <KpiTile key={k.label} {...k} icon={OPS_ICONS[k.label] ?? Activity} onNavigate={onNavigate} />
          ))}
        </div>

        {/* charts */}
        <div className="mb-7 grid grid-cols-1 gap-5 lg:grid-cols-3">
          <ChartCard
            title="Application Availability"
            subtitle={`${data.availability.total} app-environment records`}
            accent="bg-emerald-400"
            href="/application-status"
            onNavigate={onNavigate}
          >
            <div className="relative mt-1 h-[185px]">
              <ResponsiveContainer minWidth={0} minHeight={0} width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.availability.counts}
                    dataKey="value"
                    innerRadius={58}
                    outerRadius={82}
                    paddingAngle={4}
                    stroke="none"
                    cornerRadius={6}
                  >
                    {data.availability.counts.map((e, i) => (
                      <Cell key={i} fill={e.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={chartTheme.tooltip} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[30px] font-bold text-[#1B2559] dark:text-white">{data.availability.percentHealthy}%</span>
                <span className="text-[11px] font-medium text-slate-400 dark:text-white/50">healthy</span>
              </div>
            </div>
            <div className="mt-2 flex flex-wrap justify-center gap-5">
              {data.availability.counts.map((e) => (
                <button
                  key={e.name}
                  type="button"
                  onClick={() => onNavigate(`/application-status?status=${e.name}`)}
                  className="flex items-center gap-1.5 rounded-lg px-1.5 py-1 hover:bg-slate-50 dark:hover:bg-white/5"
                >
                  <span className="h-2 w-2 rounded-full" style={{ background: e.color }} />
                  <span className="text-[12px] text-slate-500 dark:text-white/55">{e.name}</span>
                  <span className="text-[12px] font-bold tabular-nums text-slate-800 dark:text-white">{e.value}</span>
                </button>
              ))}
            </div>
            <div className="mt-2 text-center text-[11px] font-medium text-slate-400 dark:text-white/45">
              Prod: {data.availability.prod.healthy}/{data.availability.prod.total} healthy
            </div>
          </ChartCard>

          <ChartCard
            title="Incident Trend"
            subtitle={INCIDENT_TREND_LABEL[period]}
            accent="bg-indigo-400"
            badge={
              incidentTrendChange && (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold",
                    incidentTrendChange.dir === "up"
                      ? "bg-rose-50 text-rose-500 dark:bg-rose-950/40 dark:text-rose-400"
                      : "bg-emerald-50 text-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-400"
                  )}
                >
                  {incidentTrendChange.dir === "up" ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {incidentTrendChange.dir === "up" ? "+" : "-"}
                  {incidentTrendChange.pct}%
                </span>
              )
            }
            href="/incidents"
            onNavigate={onNavigate}
          >
            <div className="mt-3 h-[200px]">
              <ResponsiveContainer minWidth={0} minHeight={0} width="100%" height="100%">
                <AreaChart data={incidentTrendChart} margin={{ left: -18, right: 6, top: 8 }}>
                  <defs>
                    <linearGradient id="incG" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#7C5CFF" stopOpacity={0.28} />
                      <stop offset="100%" stopColor="#7C5CFF" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="d" tick={{ fontSize: 11, fill: chartTheme.tick }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 11, fill: chartTheme.tick }}
                    axisLine={false}
                    tickLine={false}
                    width={28}
                    allowDecimals={false}
                  />
                  <Tooltip contentStyle={chartTheme.tooltip} />
                  <Area type="monotone" dataKey="v" stroke="#7C5CFF" strokeWidth={3} fill="url(#incG)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard
            title="Risk Distribution"
            subtitle="Assessed risks by band (Simple Score)"
            accent="bg-rose-400"
            href="/risks"
            onNavigate={onNavigate}
          >
            <div className="mt-3 h-[200px]">
              <ResponsiveContainer minWidth={0} minHeight={0} width="100%" height="100%">
                <BarChart data={data.riskDistribution} barCategoryGap={16} margin={{ left: -18, right: 6, top: 8 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: chartTheme.tick }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 11, fill: chartTheme.tick }}
                    axisLine={false}
                    tickLine={false}
                    width={28}
                    allowDecimals={false}
                  />
                  <Tooltip cursor={{ fill: chartTheme.cursor }} contentStyle={chartTheme.tooltip} />
                  <Bar dataKey="value" radius={[8, 8, 8, 8]} barSize={26}>
                    {data.riskDistribution.map((e, i) => (
                      <Cell key={i} fill={e.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>

        {/* bottom row */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <ChartCard
            title="Release Trend"
            subtitle={RELEASE_TREND_LABEL[period]}
            accent="bg-violet-400"
            badge={
              releaseTrendDirection && (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold",
                    releaseTrendDirection === "up"
                      ? "bg-amber-50 text-amber-500 dark:bg-amber-950/40 dark:text-amber-400"
                      : "bg-emerald-50 text-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-400"
                  )}
                >
                  {releaseTrendDirection === "up" ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {releaseTrendDirection === "up" ? "Increasing" : "Decreasing"}
                </span>
              )
            }
            href="/calendar"
            onNavigate={onNavigate}
          >
            <div className="mt-3 h-[170px]">
              <ResponsiveContainer minWidth={0} minHeight={0} width="100%" height="100%">
                <BarChart data={releaseTrendChart} barCategoryGap={22} margin={{ left: -18, right: 6, top: 8 }}>
                  <XAxis dataKey="w" tick={{ fontSize: 11, fill: chartTheme.tick }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 11, fill: chartTheme.tick }}
                    axisLine={false}
                    tickLine={false}
                    width={28}
                    allowDecimals={false}
                  />
                  <Tooltip cursor={{ fill: chartTheme.cursor }} contentStyle={chartTheme.tooltip} />
                  <Bar dataKey="v" radius={[8, 8, 8, 8]} barSize={30} fill="#7C5CFF" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard
            title="Planned Maintenance"
            subtitle="Rolling 30 days"
            accent="bg-sky-400"
            href="/planned-maintenance"
            onNavigate={onNavigate}
          >
            <div className="mt-3 space-y-2.5">
              {data.maintenance.map((m) => (
                <button
                  key={m.label}
                  type="button"
                  onClick={() => onNavigate(m.href)}
                  className="group flex w-full items-center justify-between rounded-2xl bg-[#F4F7FE] px-4 py-3 text-left transition-colors hover:bg-indigo-50 dark:bg-white/5 dark:hover:bg-indigo-500/10"
                >
                  <span className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-indigo-500 shadow-sm dark:bg-white/10 dark:shadow-none">
                      <Wrench size={16} />
                    </span>
                    <span className="text-[13px] font-medium text-slate-600 dark:text-white/70">{m.label}</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="text-[17px] font-bold tabular-nums text-[#1B2559] dark:text-white">{m.value}</span>
                    <ChevronRight
                      size={15}
                      className="text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-indigo-400 dark:text-white/25 dark:group-hover:text-indigo-400"
                    />
                  </span>
                </button>
              ))}
            </div>
          </ChartCard>

          <ChartCard title="Overall Health" subtitle="Live status by area" accent="bg-slate-300 dark:bg-slate-600" onNavigate={onNavigate}>
            <div className="mt-3 space-y-2.5">
              {data.health.map((h) => {
                const t = TONES[HEALTH_TONE[h.status] ?? "emerald"];
                return (
                  <div
                    key={h.label}
                    className="flex items-center justify-between rounded-2xl bg-[#F4F7FE] px-4 py-3 dark:bg-white/5"
                  >
                    <span className="text-[13px] font-medium text-slate-600 dark:text-white/70">{h.label}</span>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[12px] font-bold shadow-sm dark:bg-white/10 dark:shadow-none",
                        t.text
                      )}
                    >
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: t.dot }} />
                      {h.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </ChartCard>
        </div>
      </div>
    </div>
  );
}
