/**
 * Demo audit: login + hit all key API routes, test agents.
 * Run: npx tsx prisma/audit-demo.ts
 */
import { prisma } from "../lib/prisma";
import { releases as demoReleases } from "../lib/dummy-data";
import { mergeReleases, dbToUnified, demoToUnified } from "../lib/unified-releases";

const BASE = process.env.AUDIT_BASE ?? "http://localhost:3000";

async function login(): Promise<string> {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "priya@company.com", name: "Priya", role: "admin" }),
  });
  const setCookie = res.headers.get("set-cookie") ?? "";
  const match = setCookie.match(/sentinel-session=[^;]+/);
  if (!match) throw new Error("Login failed - no session cookie");
  return match[0];
}

async function get(cookie: string, path: string) {
  const res = await fetch(`${BASE}${path}`, { headers: { Cookie: cookie } });
  const text = await res.text();
  let json: unknown = null;
  try { json = JSON.parse(text); } catch { /* */ }
  return { status: res.status, ok: res.ok, json, textLen: text.length, preview: text.slice(0, 120) };
}

async function postAgent(cookie: string, agentRole: string) {
  const release = await prisma.release.findFirst({
    include: { department: true, applications: { include: { application: true } } },
  });
  const res = await fetch(`${BASE}/api/agent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      agentRole,
      context: {
        release: release
          ? {
              code: release.releaseCode,
              name: release.name,
              status: release.status,
              owner: release.owner,
              department: release.department.name,
              readiness: release.readinessPercent,
              blockers: release.blockers,
            }
          : {},
        demo: true,
      },
    }),
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, agentRole, hasText: !!(json.text || json.flags || json.build || json.warnings), error: json.error };
}

const ROUTES = [
  "/api/inbox?period=month",
  "/api/dashboard?period=month",
  "/api/unified/overview?period=month",
  "/api/releases",
  "/api/calendar",
  "/api/bookings",
  "/api/dependencies",
  "/api/conflicts",
  "/api/system-mapping/groups",
  "/api/environment-desk",
  "/api/risks",
  "/api/drifts",
  "/api/approvals",
  "/api/leaves",
  "/api/connectors",
  "/api/live-state",
  "/api/needs-attention?period=month",
  "/api/reference-data/live",
  "/api/users",
  "/api/actions/today",
];

const AGENTS = [
  "Ticket Agent", "Build Agent", "Approval Agent", "Dependency Agent", "Risk Agent",
  "Summary Agent", "Conversation Agent", "Comms Agent", "CAB Agent", "Deploy Agent",
  "Security Agent", "SLO Agent", "Runbook Agent",
];

async function main() {
  console.log("=== MERGE / COLLISION CHECK ===");
  const dbRows = await prisma.release.findMany({
    include: { department: true, applications: { include: { application: true } } },
    take: 200,
  });
  const dbUnified = dbRows.map(dbToUnified);
  const demoUnified = demoReleases.slice(0, 50).map(demoToUnified);
  const merged = mergeReleases(dbUnified, demoUnified);
  console.log(`DB releases: ${dbRows.length}, Demo releases: ${demoReleases.length}`);
  console.log(`Merged (db+demo sample): ${merged.length} (dedupe by source:code)`);
  const demoCodes = new Set(demoReleases.map((r) => r.version.toLowerCase()));
  const dbCodes = new Set(dbRows.map((r) => r.releaseCode.toLowerCase()));
  const overlap = [...demoCodes].filter((c) => dbCodes.has(c));
  console.log(`Code overlap demo vs db: ${overlap.length ? overlap.join(", ") : "none"}`);

  let cookie: string;
  try {
    cookie = await login();
    console.log("\n=== LOGIN === OK");
  } catch (e) {
    console.log("\n=== LOGIN === FAILED (dev server down?)", e);
    return;
  }

  console.log("\n=== API ROUTES ===");
  for (const path of ROUTES) {
    const r = await get(cookie, path);
    let count = "";
    if (Array.isArray(r.json)) count = ` arr=${r.json.length}`;
    else if (r.json && typeof r.json === "object") {
      const o = r.json as Record<string, unknown>;
      if (Array.isArray(o.items)) count = ` items=${o.items.length}`;
      else if (Array.isArray(o.groups)) count = ` groups=${o.groups.length}`;
      else if (Array.isArray(o.releases)) count = ` releases=${o.releases.length}`;
      else if (o.counts) count = ` counts=${JSON.stringify(o.counts).slice(0, 80)}`;
    }
    console.log(`${r.status}\t${path}${count}${!r.ok ? " ERR" : ""}`);
  }

  const sampleRelease = dbRows[0];
  if (sampleRelease) {
    const detail = await get(cookie, `/api/releases/${sampleRelease.id}`);
    const cmd = await get(cookie, `/api/releases/${sampleRelease.id}/command-center`);
    const aiCtx = await get(cookie, `/api/releases/${sampleRelease.id}/ai-context`);
    console.log(`\n=== RELEASE DETAIL (${sampleRelease.releaseCode}) ===`);
    console.log(`detail: ${detail.status}, command-center: ${cmd.status}, ai-context: ${aiCtx.status}`);
  }

  const hasKey = !!(process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY);
  console.log(`\n=== AI AGENTS (keys ${hasKey ? "present" : "MISSING"}) ===`);
  for (const agent of AGENTS) {
    const r = await postAgent(cookie, agent);
    console.log(`${r.status}\t${agent}\t${r.error ?? (r.hasText ? "OK" : "empty")}`);
  }

  const pages = [
    "/inbox", "/dashboard", "/releases", "/calendar", "/booking", "/dependencies",
    "/conflicts", "/system-mapping", "/environments", "/risks", "/drifts", "/approvals",
    "/leaves", "/executive", "/compare", "/insights", "/knowledge-graph", "/agents",
    "/history", "/connectors", "/admin/reference-data", "/admin/users", "/settings", "/templates",
  ];
  console.log("\n=== PAGE HTML STATUS ===");
  for (const p of pages) {
    const r = await fetch(`${BASE}${p}`, { headers: { Cookie: cookie }, redirect: "manual" });
    const loc = r.headers.get("location");
    console.log(`${r.status}\t${p}${loc ? ` -> ${loc}` : ""}`);
  }
}

main().finally(() => prisma.$disconnect());
