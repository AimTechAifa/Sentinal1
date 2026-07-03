import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  ArrowLeftRight,
  Bot,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  Columns2,
  GitBranch,
  History,
  LineChart,
  Network,
  Plug,
  RotateCcw,
  Shield,
  Snowflake,
  Sparkles,
  XCircle,
} from "lucide-react";
import type { QuickStartSeedId } from "./release-store";

export type QuickStartCategory =
  | "Release health"
  | "Deployment"
  | "Governance"
  | "Planning"
  | "Intelligence"
  | "Operations";

export interface QuickStartStep {
  label: string;
  detail: string;
}

export interface QuickStartTemplate {
  id: string;
  title: string;
  description: string;
  category: QuickStartCategory;
  icon: LucideIcon;
  href: string;
  releaseId?: string;
  seed?: QuickStartSeedId;
  duration: string;
  highlights: string[];
  steps: QuickStartStep[];
}

export const QUICK_START_CATEGORIES: QuickStartCategory[] = [
  "Release health",
  "Deployment",
  "Governance",
  "Planning",
  "Intelligence",
  "Operations",
];

export const QUICK_START_TEMPLATES: QuickStartTemplate[] = [
  {
    id: "healthy-green-path",
    title: "Healthy green-path release",
    description:
      "All approval gates passed, build green, and readiness high — the ideal ship candidate.",
    category: "Release health",
    icon: CheckCircle2,
    href: "/releases/rel-v2141",
    releaseId: "rel-v2141",
    seed: "green-path-v2141",
    duration: "3 min",
    highlights: ["v2.14.1 Mobile", "All gates approved", "Low blast radius"],
    steps: [
      { label: "Review readiness scorecard", detail: "Open the scorecard and confirm 100% gate coverage." },
      { label: "Inspect lifecycle strip", detail: "Every stage from build through approvals should be green." },
      { label: "Record a Go decision", detail: "Use Go/No-Go controls to simulate approval to deploy." },
      { label: "Start deployment", detail: "Launch the Harness pipeline and watch smoke tests pass." },
    ],
  },
  {
    id: "at-risk-release",
    title: "At-risk release triage",
    description:
      "Security sign-off overdue 72h, payments blast radius, and agent flags on v2.14.0.",
    category: "Release health",
    icon: AlertTriangle,
    href: "/releases/rel-v2140",
    releaseId: "rel-v2140",
    seed: "reset",
    duration: "5 min",
    highlights: ["Security gate pending", "847 files changed", "CR-8842 high risk"],
    steps: [
      { label: "Read blocker list", detail: "Security and documentation gates are still open." },
      { label: "Check yesterday diff", detail: "Compare today's state vs 24h ago — readiness dropped." },
      { label: "Review AI risk panel", detail: "Risk Agent explains payments-api dependency exposure." },
      { label: "Send approval nudge", detail: "Queue a Slack reminder to the Security approver." },
    ],
  },
  {
    id: "blocked-build",
    title: "Blocked release — failed build",
    description:
      "Billing hotfix blocked by build #4468 failures and a rejected QA gate.",
    category: "Release health",
    icon: XCircle,
    href: "/releases/rel-v2135",
    releaseId: "rel-v2135",
    seed: "reset",
    duration: "4 min",
    highlights: ["Build failed", "22 test failures", "QA gate rejected"],
    steps: [
      { label: "Open build explainer", detail: "Build Agent summarizes invoice integration failures." },
      { label: "Trace linked tickets", detail: "BILL-893 is blocked on the failing test suite." },
      { label: "Review history", detail: "See escalation and suspect commit in the audit trail." },
      { label: "Compare to healthy baseline", detail: "Jump to compare view vs v2.14.1." },
    ],
  },
  {
    id: "auto-rollback-demo",
    title: "Live deploy with auto-rollback",
    description:
      "Pre-seeded canary at 48% on v2.14.0 — watch metrics breach and Risk Agent trigger rollback.",
    category: "Deployment",
    icon: RotateCcw,
    href: "/releases/rel-v2140",
    releaseId: "rel-v2140",
    seed: "deploy-mid-v2140",
    duration: "2 min",
    highlights: ["Canary in progress", "Payments scope", "Auto-rollback armed"],
    steps: [
      { label: "Open deployment monitor", detail: "Rollout is mid-flight with live error-rate metrics." },
      { label: "Wait for canary spike", detail: "At ~55% rollout, error rate crosses the critical threshold." },
      { label: "Observe auto-rollback", detail: "Risk Agent narrates the rollback and history updates." },
      { label: "Review rollback metrics", detail: "Pod rollout resets and incident counter rises briefly." },
    ],
  },
  {
    id: "incident-during-deploy",
    title: "Incident during deployment",
    description:
      "Active incident flagged mid-rollout on a high-risk payments release — manual rollback decision.",
    category: "Deployment",
    icon: AlertTriangle,
    href: "/releases/rel-v2140",
    releaseId: "rel-v2140",
    seed: "deploy-incident-v2140",
    duration: "3 min",
    highlights: ["Active incident", "62% rollout", "Critical metrics"],
    steps: [
      { label: "Scan live metrics", detail: "Error rate, latency, and active incidents are all elevated." },
      { label: "Initiate manual rollback", detail: "Use the rollback control before auto-rollback fires." },
      { label: "Read Risk Agent narrative", detail: "AI explains blast radius and prior payments incident." },
    ],
  },
  {
    id: "green-path-deployment",
    title: "Successful production deploy",
    description:
      "Go decision recorded and deployment verified on the healthy mobile patch.",
    category: "Deployment",
    icon: Sparkles,
    href: "/releases/rel-v2141",
    releaseId: "rel-v2141",
    seed: "deploy-verified-v2141",
    duration: "2 min",
    highlights: ["Go recorded", "Verified phase", "Smoke tests passed"],
    steps: [
      { label: "Confirm Go decision", detail: "Decision badge and history show Priya's approval." },
      { label: "Review verified deployment", detail: "100% rollout with all smoke tests green." },
      { label: "Check promotion strip", detail: "Environment promotion shows production complete." },
    ],
  },
  {
    id: "multi-env-promotion",
    title: "Multi-environment promotion",
    description:
      "Large search release in staging — trace the path from build through staging to production.",
    category: "Deployment",
    icon: GitBranch,
    href: "/releases/rel-v2150",
    releaseId: "rel-v2150",
    seed: "reset",
    duration: "4 min",
    highlights: ["Staging environment", "1203 files", "Running build"],
    steps: [
      { label: "Review promotion strip", detail: "Dev → staging → production stages with current position." },
      { label: "Check running build", detail: "Build #4465 still executing — 73% tests complete." },
      { label: "Inspect dependency map", detail: "analytics-pipeline marked unstable in the blast radius." },
    ],
  },
  {
    id: "security-approval-gate",
    title: "High-risk change — approval gate",
    description:
      "Identity patch awaiting Security and Change sign-off on OAuth scope tightening.",
    category: "Governance",
    icon: Shield,
    href: "/releases/rel-v2138",
    releaseId: "rel-v2138",
    seed: "reset",
    duration: "4 min",
    highlights: ["Security pending 36h", "Pen test open", "OAuth scope change"],
    steps: [
      { label: "Review approval checklist", detail: "Security and Change gates are still pending." },
      { label: "Read Approval Agent finding", detail: "Sign-off overdue vs typical 6h turnaround." },
      { label: "Send comms reminder", detail: "Nudge Sarah Chen via email for Security review." },
    ],
  },
  {
    id: "cab-change-review",
    title: "CAB change review",
    description:
      "High-risk CR-8842 on v2.14.0 scheduled for tomorrow's Weekly Production CAB.",
    category: "Governance",
    icon: Briefcase,
    href: "/releases/rel-v2140",
    releaseId: "rel-v2140",
    seed: "reset",
    duration: "3 min",
    highlights: ["CR-8842", "CAB tomorrow", "Backout plan documented"],
    steps: [
      { label: "Open CAB panel", detail: "See session agenda, risk tier, and affected services." },
      { label: "Review change record", detail: "Backout plan covers blue-green revert and DB rollback." },
      { label: "Check Go/No-Go controls", detail: "Simulate a conditional Go pending Security sign-off." },
    ],
  },
  {
    id: "go-no-go-decision",
    title: "Go / No-Go decision workflow",
    description:
      "Practice recording an override Go with rationale on the at-risk platform release.",
    category: "Governance",
    icon: CheckCircle2,
    href: "/releases/rel-v2140",
    releaseId: "rel-v2140",
    seed: "reset",
    duration: "3 min",
    highlights: ["Override path", "Audit trail", "Notification fired"],
    steps: [
      { label: "Open Go/No-Go controls", detail: "Review recommended No-Go based on open Security gate." },
      { label: "Record conditional Go", detail: "Add rationale and mark as override decision." },
      { label: "Verify notification", detail: "Bell icon shows new decision notification." },
    ],
  },
  {
    id: "calendar-friday-risk",
    title: "Friday deploy risk",
    description:
      "Release calendar with elevated rollback risk on Friday ship windows.",
    category: "Planning",
    icon: CalendarDays,
    href: "/calendar",
    seed: "reset",
    duration: "2 min",
    highlights: ["Friday badges", "Multi-release days", "Conflict warnings"],
    steps: [
      { label: "Scan the month grid", detail: "Fridays with releases show amber Fri badges." },
      { label: "Find schedule conflicts", detail: "Days with 2+ releases flag unstable service overlap." },
      { label: "Drill into a release", detail: "Click a calendar chip to open release detail." },
    ],
  },
  {
    id: "freeze-window",
    title: "Freeze window planning",
    description:
      "Navigate to the month-end financial close blackout and review impacted planning.",
    category: "Planning",
    icon: Snowflake,
    href: "/calendar?month=freeze",
    seed: "reset",
    duration: "2 min",
    highlights: ["Month-end freeze", "No prod changes", "12–16 days out"],
    steps: [
      { label: "View freeze banner", detail: "Snowflake chips show the financial close window dates." },
      { label: "Compare release targets", detail: "Check whether scheduled releases conflict with freeze." },
      { label: "Adjust planning", detail: "Use insights to discuss deferral with stakeholders." },
    ],
  },
  {
    id: "compare-at-risk-vs-healthy",
    title: "Compare: at risk vs healthy",
    description:
      "Side-by-side readiness, blockers, and ML forecasts for v2.14.0 vs v2.14.1.",
    category: "Intelligence",
    icon: Columns2,
    href: "/compare?left=rel-v2140&right=rel-v2141",
    seed: "reset",
    duration: "3 min",
    highlights: ["Readiness delta", "Blocker diff", "Ship success forecast"],
    steps: [
      { label: "Review metric columns", detail: "Left release shows pending Security; right is all green." },
      { label: "Compare ML predictions", detail: "Ship success and rollback risk percentages diverge sharply." },
      { label: "Swap releases", detail: "Use presets or dropdowns to explore other pairings." },
    ],
  },
  {
    id: "compare-blocked-vs-ready",
    title: "Compare: blocked vs ready",
    description:
      "Contrast a failed-build hotfix against a ready mobile patch.",
    category: "Intelligence",
    icon: ArrowLeftRight,
    href: "/compare?left=rel-v2135&right=rel-v2141",
    seed: "reset",
    duration: "3 min",
    highlights: ["Build status diff", "Gate rejection", "Readiness gap"],
    steps: [
      { label: "Inspect build column", detail: "Left shows Failed; right shows Passed." },
      { label: "Review blocker lists", detail: "Integration test failures vs zero blockers." },
    ],
  },
  {
    id: "compare-large-vs-small",
    title: "Compare: large vs small change",
    description:
      "File-change volume and risk forecast for v2.15.0 search release vs mobile patch.",
    category: "Intelligence",
    icon: Columns2,
    href: "/compare?left=rel-v2150&right=rel-v2141",
    seed: "reset",
    duration: "3 min",
    highlights: ["1203 vs 156 files", "Risk Agent flags", "Rollback forecast"],
    steps: [
      { label: "Compare file counts", detail: "Search release is 4× team median file volume." },
      { label: "Check rollback risk", detail: "ML model forecasts higher rollback probability on left." },
    ],
  },
  {
    id: "executive-dashboard",
    title: "Executive portfolio snapshot",
    description:
      "C-level view — team risk heatmap, at-risk table, and AI portfolio summary.",
    category: "Intelligence",
    icon: Briefcase,
    href: "/executive",
    seed: "reset",
    duration: "4 min",
    highlights: ["Team heatmap", "ML forecasts", "AI summary"],
    steps: [
      { label: "Scan portfolio metrics", detail: "Active count, at-risk ratio, and avg ship success." },
      { label: "Review team heatmap", detail: "Platform and Billing teams show elevated risk." },
      { label: "Read AI daily brief", detail: "Summary Agent synthesizes executive talking points." },
    ],
  },
  {
    id: "insights-patterns",
    title: "Org-wide risk patterns",
    description:
      "Historical trends, predictive forecasts, and Risk Agent pattern detection.",
    category: "Intelligence",
    icon: LineChart,
    href: "/insights",
    seed: "reset",
    duration: "4 min",
    highlights: ["26-week trend", "Friday rollback spike", "Ask Risk Agent"],
    steps: [
      { label: "Review trend chart", detail: "Readiness dips and rollback spikes over 26 weeks." },
      { label: "Read detected patterns", detail: "Risk Agent flags recurring Friday deploy risk." },
      { label: "Ask a follow-up", detail: "Query the agent about mitigation strategies." },
    ],
  },
  {
    id: "agent-control-room",
    title: "Agent control room",
    description:
      "21-agent fleet with live findings on builds, approvals, dependencies, and risk.",
    category: "Operations",
    icon: Bot,
    href: "/agents",
    seed: "reset",
    duration: "5 min",
    highlights: ["13 active agents", "Live AI findings", "Pause/resume controls"],
    steps: [
      { label: "Scan featured agents", detail: "Risk, Approval, and Dependency agents highlighted." },
      { label: "Read sample findings", detail: "Each card shows recent agent observations." },
      { label: "Toggle agent pause", detail: "Simulate pausing an agent during incident response." },
    ],
  },
  {
    id: "connector-sync-issues",
    title: "Connector sync issues",
    description:
      "Integration health dashboard — filter to errored and disconnected connectors.",
    category: "Operations",
    icon: Plug,
    href: "/connectors?filter=issues",
    seed: "reset",
    duration: "3 min",
    highlights: ["Checkmarx sync failed", "Legacy ITSM disconnected", "Retry scheduled"],
    steps: [
      { label: "Review error metrics", detail: "Top cards show connected vs error vs disconnected counts." },
      { label: "Inspect Checkmarx", detail: "SAST scan sync failed — retry scheduled." },
      { label: "Note legacy bridge", detail: "BMC Helix read-only — disconnected 14 days." },
    ],
  },
  {
    id: "dependency-blast-radius",
    title: "Dependency blast radius",
    description:
      "Service graph for v2.14.0 — payments-api and four downstream dependents.",
    category: "Operations",
    icon: Network,
    href: "/releases/rel-v2140/dependencies",
    releaseId: "rel-v2140",
    seed: "reset",
    duration: "3 min",
    highlights: ["payments-api", "fraud-detection", "4 dependents"],
    steps: [
      { label: "Explore service graph", detail: "Visual map of touched and dependent services." },
      { label: "Check unstable nodes", detail: "analytics-pipeline instability affects search releases." },
      { label: "Return to release", detail: "Navigate back to assess combined risk score." },
    ],
  },
  {
    id: "audit-trail",
    title: "Global audit trail",
    description:
      "Cross-release history including agent actions, rollbacks, and human decisions.",
    category: "Operations",
    icon: History,
    href: "/history",
    seed: "reset",
    duration: "3 min",
    highlights: ["50 recent events", "Agent + human", "Rollback on v2.11.3"],
    steps: [
      { label: "Filter by release", detail: "Click release links to jump to detail pages." },
      { label: "Find rollback event", detail: "Risk Agent recorded Friday v2.11.3 rollback." },
      { label: "Compare with live state", detail: "Launch auto-rollback demo to see new entries appear." },
    ],
  },
  {
    id: "knowledge-graph",
    title: "Release knowledge graph",
    description:
      "Explore relationships between releases, services, tickets, and change records.",
    category: "Operations",
    icon: Network,
    href: "/knowledge-graph",
    seed: "reset",
    duration: "3 min",
    highlights: ["Entity links", "Cross-domain view", "Interactive graph"],
    steps: [
      { label: "Pan the graph", detail: "Discover how releases connect to services and tickets." },
      { label: "Trace v2.14.0", detail: "Follow CR-8842 and PLAT tickets to platform release." },
    ],
  },
  {
    id: "environment-desk",
    title: "Environment desk",
    description:
      "Release timeline, SAP booking, system mapping, version matrix, and app config tables.",
    category: "Planning",
    icon: GitBranch,
    href: "/environments",
    seed: "reset",
    duration: "4 min",
    highlights: ["Env booking", "Version matrix", "Enterprise impact"],
    steps: [
      { label: "Scan release timeline", detail: "Filter by department, size, and impact on the Gantt strip." },
      { label: "Check SAP booking", detail: "Review FIN SIT/UAT months booked with Guru as contact." },
      { label: "Compare versions", detail: "See SAP V2.0 in TEST vs V1.0 in PROD — promotion gap." },
    ],
  },
];

export function getQuickStartTemplate(id: string): QuickStartTemplate | undefined {
  return QUICK_START_TEMPLATES.find((t) => t.id === id);
}

export function getTemplatesByCategory(category: QuickStartCategory | "All"): QuickStartTemplate[] {
  if (category === "All") return QUICK_START_TEMPLATES;
  return QUICK_START_TEMPLATES.filter((t) => t.category === category);
}
