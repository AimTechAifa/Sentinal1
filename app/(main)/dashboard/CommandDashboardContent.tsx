"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar,
  ResponsiveContainer, XAxis, YAxis, Tooltip,
} from "recharts";
import {
  AlertTriangle, Ban, CheckCircle2, Clock, Server, GitBranch,
  Users, Activity, ShieldAlert, Wrench, ArrowUpRight, Rocket,
  TrendingUp, TrendingDown, Zap, ChevronRight, RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Tone = "rose" | "amber" | "emerald" | "indigo" | "violet" | "sky";

const TONES: Record<Tone, { wash: string; chip: string; text: string; dot: string }> = {
  rose:    { wash: "from-rose-50 to-rose-100/60",     chip: "bg-rose-500",    text: "text-rose-600",    dot: "#f43f5e" },
  amber:   { wash: "from-amber-50 to-orange-100/60",  chip: "bg-amber-500",   text: "text-amber-600",   dot: "#f59e0b" },
  emerald: { wash: "from-emerald-50 to-teal-100/60",  chip: "bg-emerald-500", text: "text-emerald-600", dot: "#10b981" },
  indigo:  { wash: "from-indigo-50 to-blue-100/60",   chip: "bg-indigo-500",  text: "text-indigo-600",  dot: "#6366f1" },
  violet:  { wash: "from-violet-50 to-purple-100/60", chip: "bg-violet-500",  text: "text-violet-600",  dot: "#8b5cf6" },
  sky:     { wash: "from-sky-50 to-cyan-100/60",      chip: "bg-sky-500",     text: "text-sky-600",     dot: "#0ea5e9" },
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
  "Env Conflicts": Server,
  "Blocked Deps": GitBranch,
  "Pending Approvals": CheckCircle2,
  "Staff on Leave": Users,
};

type Tile = { label: string; value: number; sub?: string; href: string; tone: Tone };

type DashboardPayload = {
  generatedAt: string;
  hero: { blockedReleases: number; activeP1Incidents: number; appsDownProd: number };
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

/* ---------- primitives ---------- */

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-[24px] bg-white p-6 shadow-[0_18px_40px_-24px_rgba(112,144,176,0.18)] ${className}`}>
      {children}
    </div>
  );
}

function KpiTile({ label, value, sub, href, tone, icon: Icon, onNavigate }: Tile & { icon: typeof Rocket; onNavigate: (href: string) => void }) {
  const t = TONES[tone] ?? TONES.indigo;
  return (
    <button
      onClick={() => onNavigate(href)}
      className={`group relative w-full rounded-[22px] bg-gradient-to-br ${t.wash} p-5 text-left
        transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_-20px_rgba(112,144,176,0.35)]
        focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-200`}
    >
      <div className="flex items-start justify-between">
        <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${t.chip} text-white shadow-sm`}>
          <Icon size={20} strokeWidth={2} />
        </span>
        <ArrowUpRight size={17}
          className="text-slate-400 opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:text-slate-600" />
      </div>
      <div className="mt-4 text-[32px] font-bold leading-none tracking-tight text-slate-900 tabular-nums">{value}</div>
      <div className="mt-1.5 text-[13px] font-medium text-slate-500">{label}</div>
      {sub && <div className={`mt-0.5 text-[11px] font-semibold ${t.text}`}>{sub}</div>}
    </button>
  );
}

function ChartCard({
  title, subtitle, badge, children, href, onNavigate,
}: {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
  href?: string;
  onNavigate: (href: string) => void;
}) {
  return (
    <Card>
      <div className="mb-1 flex items-start justify-between">
        <div>
          <h3 className="text-[15px] font-bold text-slate-800">{title}</h3>
          {subtitle && <p className="mt-0.5 text-[12px] text-slate-400">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">
          {badge}
          {href && (
            <button onClick={() => onNavigate(href)}
              className="flex items-center gap-0.5 text-[12px] font-semibold text-indigo-500 hover:text-indigo-700">
              View <ChevronRight size={14} />
            </button>
          )}
        </div>
      </div>
      {children}
    </Card>
  );
}

const HEALTH_TONE: Record<string, Tone> = { Healthy: "emerald", Warning: "amber", Critical: "rose" };

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CommandDashboardContent() {
  const router = useRouter();
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const onNavigate = (href: string) => router.push(href);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch("/api/dashboard")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Failed to load dashboard"))))
      .then((d) => !cancelled && setData(d))
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : "Failed to load dashboard"))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const incidentTrendChart = useMemo(
    () =>
      (data?.incidentTrend ?? []).map((d) => ({
        d: DAY_LABELS[new Date(`${d.date}T00:00:00Z`).getUTCDay()],
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

  if (loading && !data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center" style={{ background: "#F4F7FE" }}>
        <RefreshCw className="h-6 w-6 animate-spin text-indigo-400" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3" style={{ background: "#F4F7FE" }}>
        <p className="text-sm text-gray-500">{error ?? "No dashboard data"}</p>
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
    <div className="-mx-4 -mt-6 min-h-screen px-4 pb-9 pt-6 md:-mx-6 md:px-6 md:pt-9 lg:-mx-8 lg:px-8"
      style={{ background: "#F4F7FE", fontFamily: "'Plus Jakarta Sans','DM Sans',ui-sans-serif,system-ui,sans-serif" }}>
      <div className="mx-auto max-w-[1380px]">

        {/* header */}
        <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-[12px] font-semibold text-slate-400">Release Desk / Overview</div>
            <h1 className="mt-0.5 text-[30px] font-bold tracking-tight text-[#1B2559]">Command Dashboard</h1>
          </div>
          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            className="flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-[13px] font-semibold text-slate-500 shadow-[0_18px_40px_-24px_rgba(112,144,176,0.25)] hover:text-slate-700"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            Refresh
          </button>
        </div>

        {/* HERO */}
        <div className="mb-7 overflow-hidden rounded-[28px] bg-gradient-to-r from-[#3E2CBB] via-[#5A3FE0] to-[#7C5CFF] p-7 text-white shadow-[0_30px_60px_-25px_rgba(90,63,224,0.55)]">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div>
              <div className="text-[12px] font-semibold uppercase tracking-[0.18em] text-white/60">Needs attention now</div>
              <div className="mt-2 flex flex-wrap items-end gap-8">
                {[
                  { n: data.hero.blockedReleases, l: "Blocked releases", href: "/releases?status=Blocked" },
                  { n: data.hero.activeP1Incidents, l: "P1 incidents", href: "/incidents?severity=P1" },
                  { n: data.hero.appsDownProd, l: "Apps down in Prod", href: "/application-status?status=Down&env=Prod" },
                ].map((x) => (
                  <button key={x.l} onClick={() => onNavigate(x.href)} className="group text-left focus:outline-none">
                    <div className="text-[44px] font-bold leading-none tabular-nums transition-transform duration-300 group-hover:scale-105">{x.n}</div>
                    <div className="mt-1 flex items-center gap-1 text-[13px] font-medium text-white/70 group-hover:text-white">
                      {x.l} <ArrowUpRight size={14} className="opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div className="hidden h-24 w-px bg-white/15 md:block" />
            <div className="max-w-[300px]">
              <div className="text-[13px] leading-relaxed text-white/75">
                Every number on this board is a shortcut — click any figure to open the corresponding page with the filter already applied.
              </div>
            </div>
          </div>
        </div>

        {/* Release pipeline */}
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[15px] font-bold text-[#1B2559]">Release Pipeline</h2>
          <button onClick={() => onNavigate("/releases")}
            className="flex items-center gap-0.5 text-[12.5px] font-semibold text-indigo-500 hover:text-indigo-700">
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
          <h2 className="text-[15px] font-bold text-[#1B2559]">Operations &amp; Environments</h2>
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
            href="/application-status"
            onNavigate={onNavigate}
          >
            <div className="relative mt-1 h-[185px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.availability.counts} dataKey="value" innerRadius={58} outerRadius={82} paddingAngle={4} stroke="none" cornerRadius={6}>
                    {data.availability.counts.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 10px 30px -10px rgba(112,144,176,.35)", fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[30px] font-bold text-[#1B2559]">{data.availability.percentHealthy}%</span>
                <span className="text-[11px] font-medium text-slate-400">healthy</span>
              </div>
            </div>
            <div className="mt-2 flex justify-center gap-5">
              {data.availability.counts.map((e) => (
                <button key={e.name} onClick={() => onNavigate(`/application-status?status=${e.name}`)}
                  className="flex items-center gap-1.5 rounded-lg px-1.5 py-1 hover:bg-slate-50">
                  <span className="h-2 w-2 rounded-full" style={{ background: e.color }} />
                  <span className="text-[12px] text-slate-500">{e.name}</span>
                  <span className="text-[12px] font-bold text-slate-800 tabular-nums">{e.value}</span>
                </button>
              ))}
            </div>
            <div className="mt-2 text-center text-[11px] font-medium text-slate-400">
              Prod: {data.availability.prod.healthy}/{data.availability.prod.total} healthy
            </div>
          </ChartCard>

          <ChartCard
            title="Incident Trend"
            subtitle="Last 7 days of recorded activity"
            badge={
              incidentTrendChange && (
                <span className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold",
                  incidentTrendChange.dir === "up" ? "bg-rose-50 text-rose-500" : "bg-emerald-50 text-emerald-500"
                )}>
                  {incidentTrendChange.dir === "up" ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {incidentTrendChange.dir === "up" ? "+" : "-"}{incidentTrendChange.pct}%
                </span>
              )
            }
            href="/incidents"
            onNavigate={onNavigate}
          >
            <div className="mt-3 h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={incidentTrendChart} margin={{ left: -18, right: 6, top: 8 }}>
                  <defs>
                    <linearGradient id="incG" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#7C5CFF" stopOpacity={0.28} />
                      <stop offset="100%" stopColor="#7C5CFF" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="d" tick={{ fontSize: 11, fill: "#A3AED0" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#A3AED0" }} axisLine={false} tickLine={false} width={28} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 10px 30px -10px rgba(112,144,176,.35)", fontSize: 12 }} />
                  <Area type="monotone" dataKey="v" stroke="#7C5CFF" strokeWidth={3} fill="url(#incG)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard title="Risk Distribution" subtitle="Assessed risks by band (Simple Score)" href="/risks" onNavigate={onNavigate}>
            <div className="mt-3 h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.riskDistribution} barCategoryGap={16} margin={{ left: -18, right: 6, top: 8 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#A3AED0" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#A3AED0" }} axisLine={false} tickLine={false} width={28} allowDecimals={false} />
                  <Tooltip cursor={{ fill: "#F4F7FE" }} contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 10px 30px -10px rgba(112,144,176,.35)", fontSize: 12 }} />
                  <Bar dataKey="value" radius={[8, 8, 8, 8]} barSize={26}>
                    {data.riskDistribution.map((e, i) => <Cell key={i} fill={e.color} />)}
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
            subtitle="Next 4 weeks"
            badge={
              releaseTrendDirection && (
                <span className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold",
                  releaseTrendDirection === "up" ? "bg-amber-50 text-amber-500" : "bg-emerald-50 text-emerald-500"
                )}>
                  {releaseTrendDirection === "up" ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {releaseTrendDirection === "up" ? "Increasing" : "Decreasing"}
                </span>
              )
            }
            href="/calendar"
            onNavigate={onNavigate}
          >
            <div className="mt-3 h-[170px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={releaseTrendChart} barCategoryGap={22} margin={{ left: -18, right: 6, top: 8 }}>
                  <XAxis dataKey="w" tick={{ fontSize: 11, fill: "#A3AED0" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#A3AED0" }} axisLine={false} tickLine={false} width={28} allowDecimals={false} />
                  <Tooltip cursor={{ fill: "#F4F7FE" }} contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 10px 30px -10px rgba(112,144,176,.35)", fontSize: 12 }} />
                  <Bar dataKey="v" radius={[8, 8, 8, 8]} barSize={30} fill="#7C5CFF" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard title="Planned Maintenance" subtitle="Rolling 30 days" href="/planned-maintenance" onNavigate={onNavigate}>
            <div className="mt-3 space-y-2.5">
              {data.maintenance.map((m) => (
                <button key={m.label} onClick={() => onNavigate(m.href)}
                  className="group flex w-full items-center justify-between rounded-2xl bg-[#F4F7FE] px-4 py-3 text-left transition-colors hover:bg-indigo-50">
                  <span className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-indigo-500 shadow-sm">
                      <Wrench size={16} />
                    </span>
                    <span className="text-[13px] font-medium text-slate-600">{m.label}</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="text-[17px] font-bold text-[#1B2559] tabular-nums">{m.value}</span>
                    <ChevronRight size={15} className="text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-indigo-400" />
                  </span>
                </button>
              ))}
            </div>
          </ChartCard>

          <ChartCard title="Overall Health" subtitle="Live status by area" onNavigate={onNavigate}>
            <div className="mt-3 space-y-2.5">
              {data.health.map((h) => {
                const t = TONES[HEALTH_TONE[h.status] ?? "emerald"];
                return (
                  <div key={h.label} className="flex items-center justify-between rounded-2xl bg-[#F4F7FE] px-4 py-3">
                    <span className="text-[13px] font-medium text-slate-600">{h.label}</span>
                    <span className={`inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[12px] font-bold ${t.text} shadow-sm`}>
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
