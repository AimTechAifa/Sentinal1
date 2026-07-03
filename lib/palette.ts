/**
 * Release Desk design tokens (Deep Indigo primary — design.md).
 * Primary #3B5BDB · Surface #F8F9FA · On-Surface #151C22
 * Tailwind, globals.css, and MUI theme mirror these values.
 */

export const palette = {
  brand: {
    25: "#fbfcfd",
    50: "#eff6ff",
    100: "#dbeafe",
    200: "#bfdbfe",
    300: "#93c5fd",
    400: "#60a5fa",
    500: "#2563eb", // Royal Blue
    600: "#1d4ed8",
    700: "#1e40af",
    800: "#1e3a8a",
    900: "#172554",
    950: "#0a1128",
  },
  accent: {
    50: "#f8fafc",
    100: "#f1f5f9",
    200: "#e2e8f0",
    300: "#cbd5e1",
    400: "#94a3b8",
    500: "#64748b",
    600: "#475569",
    700: "#334155",
    800: "#1e293b",
    900: "#0f172a",
  },
  gray: {
    25: "#fcfcfd",
    50: "#f8fafc",
    100: "#f1f5f9",
    200: "#e2e8f0",
    300: "#cbd5e1",
    400: "#94a3b8",
    500: "#64748b",
    600: "#475569",
    700: "#334155",
    800: "#1e293b",
    900: "#0f172a",
    950: "#020617",
  },
  success: {
    50: "#ebfbee",
    100: "#d3f9d8",
    500: "#40c057",
    600: "#2f9e44",
    700: "#2b8a3e",
  },
  warning: {
    50: "#fff9db",
    100: "#fff3bf",
    500: "#fab005",
    600: "#f59f00",
    700: "#e67700",
  },
  error: {
    50: "#fff5f5",
    100: "#ffe3e3",
    500: "#ba1a1a",
    600: "#93000a",
    700: "#7d0008",
  },
  info: {
    50: "#e7f5ff",
    100: "#d0ebff",
    500: "#228be6",
    600: "#1c7ed6",
    700: "#1971c2",
  },
  /** Material-3 surface tiers from design.md — use for dark-mode prep */
  surfaceTiers: {
    surface: "#f6f9ff",
    surfaceDim: "#d4dbe3",
    surfaceBright: "#f6f9ff",
    containerLowest: "#ffffff",
    containerLow: "#eef4fd",
    container: "#e8eef7",
    containerHigh: "#e2e9f1",
    containerHighest: "#dce3ec",
    onSurface: "#151c22",
    onSurfaceVariant: "#444654",
    inverseSurface: "#2a3138",
    inverseOnSurface: "#ebf1fa",
    outline: "#747686",
    outlineVariant: "#c4c5d6",
    surfaceTint: "#3052d2",
    surfaceVariant: "#dce3ec",
  },
  /** Design.md tertiary (amber/burnt-orange) */
  tertiary: {
    main: "#863700",
    container: "#ac4900",
    onContainer: "#ffe0d2",
  },
  surface: "#f8fafc",
  border: "#e2e8f0",
  sidebar: "#ffffff",
  foreground: "#0f172a",
  ai: "#2563eb",
} as const;

export type ReadinessTier = "high" | "medium" | "low";

export const readinessTokens: Record<
  ReadinessTier,
  { color: string; ring: string; bg: string; text: string; label: string }
> = {
  high: {
    color: palette.success[500],
    ring: "ring-success-500/30",
    bg: "bg-success-50",
    text: "text-success-700",
    label: "Ready",
  },
  medium: {
    color: palette.warning[500],
    ring: "ring-warning-500/30",
    bg: "bg-warning-50",
    text: "text-warning-700",
    label: "At risk",
  },
  low: {
    color: palette.error[500],
    ring: "ring-error-500/30",
    bg: "bg-error-50",
    text: "text-error-700",
    label: "Not ready",
  },
};

export function readinessTier(value: number): ReadinessTier {
  if (value >= 80) return "high";
  if (value >= 50) return "medium";
  return "low";
}

export function readinessColor(value: number): string {
  return readinessTokens[readinessTier(value)].color;
}

export const sourceTokens = {
  database: {
    bg: "bg-brand-50",
    text: "text-brand-600",
    border: "border-brand-200",
  },
  demo: {
    bg: "bg-accent-100",
    text: "text-accent-700",
    border: "border-accent-200",
  },
} as const;

export const statusTokens: Record<string, { bg: string; text: string }> = {
  /* Green — Shipped / Healthy / Ready */
  Approved: { bg: "bg-success-50", text: "text-success-600" },
  Passed: { bg: "bg-success-50", text: "text-success-600" },
  Ready: { bg: "bg-success-50", text: "text-success-600" },
  Connected: { bg: "bg-success-50", text: "text-success-600" },
  Shipped: { bg: "bg-success-50", text: "text-success-600" },
  Go: { bg: "bg-success-50", text: "text-success-600" },
  Active: { bg: "bg-success-50", text: "text-success-600" },
  Verified: { bg: "bg-success-50", text: "text-success-600" },
  Complete: { bg: "bg-success-50", text: "text-success-600" },
  /* Amber — At Risk / Delayed */
  Pending: { bg: "bg-warning-50", text: "text-warning-700" },
  Running: { bg: "bg-warning-50", text: "text-warning-700" },
  "At Risk": { bg: "bg-warning-50", text: "text-warning-700" },
  Verifying: { bg: "bg-warning-50", text: "text-warning-700" },
  /* Blue — Scheduled / In Progress / Syncing */
  Scheduled: { bg: "bg-info-50", text: "text-info-600" },
  Planned: { bg: "bg-info-50", text: "text-info-600" },
  "In Progress": { bg: "bg-info-50", text: "text-info-600" },
  Syncing: { bg: "bg-info-50", text: "text-info-600" },
  /* Red — Blocked / Failed / Overdue */
  Rejected: { bg: "bg-error-50", text: "text-error-600" },
  Failed: { bg: "bg-error-50", text: "text-error-600" },
  Blocked: { bg: "bg-error-50", text: "text-error-600" },
  "No-Go": { bg: "bg-error-50", text: "text-error-600" },
  Error: { bg: "bg-error-50", text: "text-error-600" },
  "Rolled Back": { bg: "bg-error-50", text: "text-error-600" },
  Overdue: { bg: "bg-error-50", text: "text-error-600" },
  /* Gray — Not Started / Archived / Draft */
  Deferred: { bg: "bg-gray-100", text: "text-gray-600" },
  Disconnected: { bg: "bg-gray-100", text: "text-gray-600" },
  Paused: { bg: "bg-gray-100", text: "text-gray-600" },
  "Not Started": { bg: "bg-gray-100", text: "text-gray-600" },
  Draft: { bg: "bg-gray-100", text: "text-gray-600" },
  Archived: { bg: "bg-gray-100", text: "text-gray-600" },
  "N/A": { bg: "bg-gray-100", text: "text-gray-600" },
};

/** Chart / knowledge-graph node colors */
export const chartColors = {
  person: palette.success[500],
  release: palette.brand[500],
  service: palette.info[500],
  ticket: palette.warning[500],
  change: palette.accent[500],
  incident: palette.error[500],
} as const;
