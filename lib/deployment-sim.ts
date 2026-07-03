import type { DeploymentLiveState, DeploymentPhase, DeploymentSmokeTest, LiveMetricSnapshot, Release } from "./types";

export function defaultSmokeTests(release: Release): DeploymentSmokeTest[] {
  const names = [
    "Health check — api-gateway",
    "Payment path synthetic transaction",
    "Auth token refresh",
    "Error rate baseline (< 1%)",
  ];
  return names.slice(0, 3 + (release.dependsOnServices.includes("svc-payments") ? 1 : 0)).map((name, i) => ({
    id: `smoke-${i}`,
    name,
    status: "Pending" as const,
  }));
}

export function isHighRiskDeploy(release: Release): boolean {
  return (
    release.status === "At Risk" ||
    release.filesChanged > 400 ||
    release.dependsOnServices.includes("svc-payments")
  );
}

export function defaultMetrics(release: Release, rolloutPct: number): LiveMetricSnapshot[] {
  const baseLatency = release.dependsOnServices.includes("svc-payments") ? 210 : 145;
  const baseError = release.status === "At Risk" ? 0.42 : 0.18;

  return [
    {
      id: "rollout",
      label: "Pod rollout",
      value: rolloutPct,
      unit: "%",
      threshold: 100,
      status: rolloutPct >= 100 ? "healthy" : rolloutPct >= 50 ? "warning" : "healthy",
    },
    {
      id: "error-rate",
      label: "Error rate",
      value: baseError,
      unit: "%",
      threshold: 1.0,
      status: baseError < 0.5 ? "healthy" : baseError < 1 ? "warning" : "critical",
    },
    {
      id: "latency",
      label: "p99 latency",
      value: baseLatency,
      unit: "ms",
      threshold: 450,
      status: baseLatency < 300 ? "healthy" : baseLatency < 450 ? "warning" : "critical",
    },
    {
      id: "incidents",
      label: "Active incidents",
      value: 0,
      unit: "",
      threshold: 0,
      status: "healthy",
    },
  ];
}

export function detectCriticalBreach(metrics: LiveMetricSnapshot[]): string | null {
  const error = metrics.find((m) => m.id === "error-rate");
  if (error && error.status === "critical") {
    return `Error rate ${error.value}${error.unit} exceeded threshold (${error.threshold}${error.unit})`;
  }
  const latency = metrics.find((m) => m.id === "latency");
  if (latency && latency.status === "critical") {
    return `p99 latency ${latency.value}${latency.unit} exceeded threshold (${latency.threshold}${latency.unit})`;
  }
  const incidents = metrics.find((m) => m.id === "incidents");
  if (incidents && incidents.value > incidents.threshold) {
    return `Active incidents (${incidents.value}) during rollout`;
  }
  return null;
}

function applyCanarySpike(
  metrics: LiveMetricSnapshot[],
  release: Release,
  rolloutPct: number
): LiveMetricSnapshot[] {
  if (!isHighRiskDeploy(release) || rolloutPct < 45) return metrics;
  if (rolloutPct < 55) {
    return metrics.map((m) =>
      m.id === "error-rate"
        ? { ...m, value: 0.82, status: "warning" as const }
        : m
    );
  }
  return metrics.map((m) => {
    if (m.id === "error-rate") return { ...m, value: 1.18, status: "critical" as const };
    if (m.id === "latency" && rolloutPct >= 62) return { ...m, value: 480, status: "critical" as const };
    return m;
  });
}

export function createInitialDeploymentState(release: Release, phase: DeploymentPhase = "Not Started"): DeploymentLiveState {
  const rolloutPct = phase === "Verified" ? 100 : phase === "In Progress" ? 35 : 0;
  return {
    phase,
    rolloutPct,
    smokeTests: defaultSmokeTests(release),
    metrics: defaultMetrics(release, rolloutPct),
    ...(phase === "Verified" ? { completedAt: new Date().toISOString() } : {}),
  };
}

export function tickDeployment(state: DeploymentLiveState, release: Release): DeploymentLiveState {
  if (state.phase === "In Progress") {
    const nextRollout = Math.min(100, state.rolloutPct + 6 + (release.filesChanged > 400 ? 2 : 4));
    let metrics = jitterMetrics(defaultMetrics(release, nextRollout), state.metrics, "deploy");
    metrics = applyCanarySpike(metrics, release, nextRollout);

    const breach = detectCriticalBreach(metrics);
    if (breach) {
      return autoRollbackDeploymentState({ ...state, rolloutPct: nextRollout, metrics }, release, breach);
    }

    if (nextRollout >= 100) {
      const tests = state.smokeTests.map((t, i) => ({
        ...t,
        status: i === 0 ? ("Running" as const) : t.status,
      }));
      return {
        ...state,
        phase: "Verifying",
        rolloutPct: 100,
        metrics,
        smokeTests: tests,
      };
    }

    return { ...state, rolloutPct: nextRollout, metrics };
  }

  if (state.phase === "Verifying") {
    let metrics = jitterMetrics(defaultMetrics(release, 100), state.metrics, "deploy");
    metrics = applyCanarySpike(metrics, release, 100);
    const breach = detectCriticalBreach(metrics);
    if (breach) {
      return autoRollbackDeploymentState({ ...state, metrics }, release, breach);
    }

    const runningIdx = state.smokeTests.findIndex((t) => t.status === "Running");
    if (runningIdx >= 0) {
      const tests = [...state.smokeTests];
      tests[runningIdx] = { ...tests[runningIdx], status: "Passed" };
      if (runningIdx + 1 < tests.length) {
        tests[runningIdx + 1] = { ...tests[runningIdx + 1], status: "Running" };
      } else {
        return {
          ...state,
          phase: "Verified",
          smokeTests: tests,
          completedAt: new Date().toISOString(),
          metrics: jitterMetrics(defaultMetrics(release, 100), state.metrics, "stable"),
        };
      }
      return { ...state, smokeTests: tests, metrics };
    }
  }

  return state;
}

function jitterMetrics(
  base: LiveMetricSnapshot[],
  prev: LiveMetricSnapshot[],
  mode: "deploy" | "rollback" | "stable"
): LiveMetricSnapshot[] {
  const wobble = (Date.now() % 17) / 100;
  return base.map((m) => {
    const p = prev.find((x) => x.id === m.id);
    let value = m.value;
    if (m.id === "error-rate") {
      const delta = mode === "rollback" ? 0.35 : mode === "deploy" ? wobble - 0.04 : 0.05;
      value = Math.max(0, Math.round(((p?.value ?? m.value) + delta) * 100) / 100);
    } else if (m.id === "latency") {
      const delta = mode === "rollback" ? 40 : wobble * 20 - 10;
      value = Math.round((p?.value ?? m.value) + delta);
    } else if (m.id === "incidents" && mode === "rollback") {
      value = 1;
    }
    const status =
      m.id === "error-rate"
        ? value < 0.5
          ? "healthy"
          : value < 1
            ? "warning"
            : "critical"
        : m.id === "latency"
          ? value < 300
            ? "healthy"
            : value < 450
              ? "warning"
              : "critical"
          : m.id === "incidents"
            ? value === 0
              ? "healthy"
              : "critical"
            : m.status;
    return { ...m, value, status };
  });
}

export function startDeploymentState(release: Release): DeploymentLiveState {
  return createMidRolloutState(release, 8);
}

export function createMidRolloutState(release: Release, rolloutPct: number): DeploymentLiveState {
  const metrics = applyCanarySpike(defaultMetrics(release, rolloutPct), release, rolloutPct);
  return {
    phase: "In Progress",
    rolloutPct,
    smokeTests: defaultSmokeTests(release),
    metrics,
    startedAt: new Date(Date.now() - 180000).toISOString(),
  };
}

export function createIncidentDeployState(release: Release): DeploymentLiveState {
  const rolloutPct = 62;
  const metrics = applyCanarySpike(defaultMetrics(release, rolloutPct), release, rolloutPct).map((m) =>
    m.id === "incidents" ? { ...m, value: 1, status: "critical" as const } : m
  );
  return {
    phase: "In Progress",
    rolloutPct,
    smokeTests: defaultSmokeTests(release).map((t, i) =>
      i === 0 ? { ...t, status: "Passed" as const } : t
    ),
    metrics,
    startedAt: new Date(Date.now() - 300000).toISOString(),
  };
}

export function rollbackDeploymentState(
  state: DeploymentLiveState,
  release: Release,
  opts?: { auto?: boolean; reason?: string }
): DeploymentLiveState {
  return {
    ...state,
    phase: "Rolled Back",
    rolloutPct: 0,
    completedAt: new Date().toISOString(),
    autoRollback: opts?.auto ?? state.autoRollback,
    rollbackReason: opts?.reason ?? state.rollbackReason,
    metrics: jitterMetrics(defaultMetrics(release, 0), state.metrics, "rollback"),
    smokeTests: state.smokeTests.map((t) => ({
      ...t,
      status: t.status === "Passed" ? "Passed" : "Failed",
    })),
  };
}

export function autoRollbackDeploymentState(
  state: DeploymentLiveState,
  release: Release,
  reason: string
): DeploymentLiveState {
  return rollbackDeploymentState(state, release, { auto: true, reason });
}

export function getDeploymentPhaseLabel(phase: DeploymentPhase): string {
  return phase;
}

/** Interval used by DeploymentMonitor polling — keeps server/client rollout in sync. */
export const DEPLOYMENT_TICK_MS = 2500;

/** Elapsed-time deployment state — server-authoritative, no stored rolloutPct. */
export function computeLiveDeploymentState(
  release: Release,
  stored: {
    phase: DeploymentPhase;
    startedAt: Date | null;
    rollbackReason?: string | null;
    rollbackNarrative?: string | null;
    rolledBackAt?: Date | null;
  } | null,
  now: Date = new Date()
): DeploymentLiveState {
  if (!stored) {
    if (release.status === "Shipped") return createInitialDeploymentState(release, "Verified");
    return createInitialDeploymentState(release, "Not Started");
  }

  if (stored.phase === "Rolled Back") {
    const base = rollbackDeploymentState(
      {
        phase: "Rolled Back",
        rolloutPct: 0,
        smokeTests: defaultSmokeTests(release),
        metrics: defaultMetrics(release, 0),
        startedAt: stored.startedAt?.toISOString(),
        completedAt: stored.rolledBackAt?.toISOString(),
        autoRollback: !!stored.rollbackReason,
        rollbackReason: stored.rollbackReason ?? undefined,
      },
      release,
      { auto: !!stored.rollbackReason, reason: stored.rollbackReason ?? undefined }
    );
    return { ...base, rollbackNarrative: stored.rollbackNarrative ?? undefined };
  }

  if (stored.phase === "Verified") {
    return createInitialDeploymentState(release, "Verified");
  }

  if (stored.phase === "Not Started") {
    return createInitialDeploymentState(release, "Not Started");
  }

  const startedAt = stored.startedAt ?? now;
  const tickCount = Math.max(0, Math.floor((now.getTime() - startedAt.getTime()) / DEPLOYMENT_TICK_MS));

  let state: DeploymentLiveState = {
    ...startDeploymentState(release),
    startedAt: startedAt.toISOString(),
  };

  for (let i = 0; i < tickCount; i++) {
    const prev = state;
    state = tickDeployment(state, release);
    if (state.phase === "Rolled Back" || state === prev) break;
  }

  if (state.autoRollback) {
    return {
      ...state,
      rollbackReason: state.rollbackReason ?? stored.rollbackReason ?? undefined,
      rollbackNarrative: stored.rollbackNarrative ?? undefined,
    };
  }

  return { ...state, rollbackNarrative: stored.rollbackNarrative ?? undefined };
}

/** Backdate startedAt so elapsed ticks reach a target rollout (for demo seeds). */
export function startedAtForRollout(release: Release, targetRolloutPct: number, now: Date = new Date()): Date {
  let state = startDeploymentState(release);
  let ticks = 0;
  while (state.rolloutPct < targetRolloutPct && state.phase === "In Progress" && ticks < 200) {
    const next = tickDeployment(state, release);
    if (next === state) break;
    state = next;
    ticks++;
  }
  return new Date(now.getTime() - ticks * DEPLOYMENT_TICK_MS);
}
