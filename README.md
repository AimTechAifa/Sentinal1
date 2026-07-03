# Sentinel — AI-Powered Release Command Center

Built by release managers for release management.

Flagship demo prototype for stakeholder screen recordings. Static dummy data with real LLM-powered agent responses. **Live demo state** (Go/No-Go decisions, deployments, notifications, agent pause) persists in **SQLite** via `/api/live-state` — shared across sessions and roles.

## Setup

1. Install dependencies (already done if cloned with node_modules):
   ```bash
   npm install
   ```

2. Copy environment file and add your API key:
   ```bash
   cp .env.local.example .env.local
   ```
   Add at least one key to `.env.local`:
   ```
   OPENAI_API_KEY=sk-...
   # optional fallback:
   ANTHROPIC_API_KEY=sk-ant-...
   ```

3. Run the dev server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) — sign in with any credentials to reach the dashboard.

### Release Desk MVP (database-backed)

1. Initialize the SQLite database and seed reference data **plus demo-ready live state**:
   ```bash
   npm run db:setup
   ```
   This loads departments/apps/environments, **8 MVP releases** (At Risk, Blocked, Ready, Shipped, etc.), env bookings, P1 issues, and **AI Command Center state** (Go/No-Go decisions, mid-canary deploy on v2.14.0, notifications, history).

2. Sign in at `/login` — select **Admin**, **Editor**, or **Read only** (Microsoft SSO demo).

3. Key MVP routes:
   - `/admin/reference-data` — Departments, Applications, Environments (Admin)
   - `/booking` — Multi-app env booking with availability check
   - `/system-mapping` — Mapping vs booking risk analysis
   - `/releases` — Release list from database
   - `/dashboard` — Month/Quarter/Year counts + P1 issues

4. Open [http://localhost:3000](http://localhost:3000) — sign in (Admin recommended for setup). Default landing is **Morning Inbox** (`/inbox`).

Design tokens live in `lib/palette.ts` (brand, accent, semantic, readiness tiers) and are wired into Tailwind and CSS variables.

See **[WORKFLOW.md](./WORKFLOW.md)** for step-by-step Release Desk workflow (reference data → releases → booking → mapping → dashboard). A Word copy is available as **[WORKFLOW.docx](./WORKFLOW.docx)**.

### Deploy to Vercel

The build seeds `prisma/dev.db` automatically and bundles it for serverless API routes.

1. Connect the GitHub repo in Vercel (framework preset: **Next.js**).
2. Add environment variables in the Vercel project:
   - `OPENAI_API_KEY` (optional — AI summaries fall back to static text without it)
   - `ANTHROPIC_API_KEY` (optional fallback)
3. Deploy — no manual `db:setup` needed; `npm run build` runs `prisma db push` + seed.

**Note:** SQLite on Vercel is suitable for **read-heavy demos**. Edits made in production may not persist across cold starts. For persistent production data, migrate to [Turso](https://turso.tech) or Vercel Postgres.

## Pages

| Route | Description |
|---|---|
| `/login` | Fake login → Morning Inbox |
| `/inbox` | Daily action queue — blocked, P1s, mapping conflicts, approvals |
| `/dashboard` | Executive overview + AI daily summary + live activity feed |
| `/templates` | Quick Start — 22 guided demo scenarios with seeded state |
| `/executive` | C-level portfolio dashboard, risk heatmap, ML forecasts |
| `/releases` | Full release list with readiness % and blocker counts |
| `/releases/[id]` | Release command center — DB readiness/lifecycle or demo panels |
| `/releases/[id]/dependencies` | React Flow dependency map |
| `/compare` | Side-by-side release comparison |
| `/knowledge-graph` | Org-wide knowledge graph (releases, services, people, CRs) |
| `/calendar` | Release calendar + freeze windows |
| `/environments` | **Environment Desk** — timeline, env booking, topology, version matrix, config ([docs](./docs/ENVIRONMENT-DESK.md)) |
| `/history` | Global audit trail (static + your live decisions/deployments) |
| `/connectors` | 59 enterprise integrations — errors link to release blockers |
| `/agents` | Agent control room — 13 AI agents with pause/resume |
| `/insights` | Org-wide AI risk, trends, and predictive ML |
| `/settings` | Team/role settings |

## Demo flow

1. Open **Quick Start** (`/templates`) and launch a scenario (e.g. auto-rollback, healthy green-path).
2. Record a **Go** decision on a release — it appears in **History**, **Notifications**, and **AI chat** context.
3. Use the bell icon for unread alerts; click **Audit trail** on a notification to jump to filtered history.
4. **Reset demo state** from the Templates page to clear live operational state and start fresh.

## Environment Desk

Portfolio view for release managers: **schedule → environment → version → impact** in one screen.

- **Route:** `/environments` (sidebar: Portfolio → Environment Desk)
- **Documentation:** [docs/ENVIRONMENT-DESK.md](./docs/ENVIRONMENT-DESK.md)

Synthetic data is derived from the release train (`releases`, `services`, deployment configs, change records). Panels cross-link: select a timeline bar or version row to sync booking and config tabs. Use the Quick Start template **Environment desk** under Planning for a guided walkthrough.

## Demo anchors

- **v2.14.0** — overdue Security approval, high file-change count
- **v2.13.5** — failed build
- **v2.15.0** — large release, build running

## Tech stack

Next.js 14 · TypeScript · Tailwind CSS · recharts · reactflow · OpenAI / Anthropic

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for release notes.
