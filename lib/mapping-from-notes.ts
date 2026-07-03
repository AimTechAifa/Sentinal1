export type SuggestedMappingEdge = {
  sourceApp: string;
  sourceEnv: string;
  targetApp: string;
  targetEnv: string;
  direction?: string;
  notes?: string;
};

type AppRow = {
  id: string;
  name: string;
  environments: { id: string; name: string; type: string }[];
};

const ENV_HINTS = [
  { pattern: /\b(integration\s*test|int\s*test)\b/i, types: ["test", "integration"], names: ["test", "integration"] },
  { pattern: /\bprod(uction)?\b/i, types: ["prod"], names: ["prod"] },
  { pattern: /\buat\b/i, types: ["uat"], names: ["uat"] },
  { pattern: /\btest\b/i, types: ["test"], names: ["test"] },
  { pattern: /\bdev(elopment)?\b/i, types: ["dev"], names: ["dev"] },
];

function findApp(text: string, apps: AppRow[]): AppRow | undefined {
  const lower = text.toLowerCase();
  return apps.find((a) => lower.includes(a.name.toLowerCase()));
}

function matchEnvironment(app: AppRow, fragment: string) {
  const lower = fragment.toLowerCase();
  for (const hint of ENV_HINTS) {
    if (!hint.pattern.test(lower)) continue;
    const byType = app.environments.find((e) =>
      hint.types.some((t) => e.type.toLowerCase().includes(t))
    );
    if (byType) return byType;
    const byName = app.environments.find((e) =>
      hint.names.some((n) => e.name.toLowerCase().includes(n))
    );
    if (byName) return byName;
  }
  const byName = app.environments.find((e) => lower.includes(e.name.toLowerCase()));
  if (byName) return byName;
  return app.environments[0];
}

function clauseToEdge(clause: string, apps: AppRow[]): SuggestedMappingEdge | null {
  const feed = clause.match(/^(.+?)\s+(feeds|→|->|depends on|connects to|maps to)\s+(.+)$/i);
  const sourceText = feed?.[1] ?? clause;
  const targetText = feed?.[3] ?? clause;

  const sourceApp = findApp(sourceText, apps);
  const targetApp = findApp(targetText, apps);
  if (!sourceApp || !targetApp || sourceApp.id === targetApp.id) {
    const mentioned = apps.filter((a) => clause.toLowerCase().includes(a.name.toLowerCase()));
    if (mentioned.length < 2) return null;
    const [src, tgt] = mentioned;
    const sourceEnv = matchEnvironment(src, sourceText);
    const targetEnv = matchEnvironment(tgt, targetText);
    return {
      sourceApp: src.name,
      sourceEnv: sourceEnv.name,
      targetApp: tgt.name,
      targetEnv: targetEnv.name,
      direction: "downstream",
      notes: clause,
    };
  }

  const sourceEnv = matchEnvironment(sourceApp, sourceText);
  const targetEnv = matchEnvironment(targetApp, targetText);
  return {
    sourceApp: sourceApp.name,
    sourceEnv: sourceEnv.name,
    targetApp: targetApp.name,
    targetEnv: targetEnv.name,
    direction: "downstream",
    notes: clause,
  };
}

export function parseNotesToMappingEdges(notes: string, apps: AppRow[]): SuggestedMappingEdge[] {
  const clauses = notes
    .split(/[;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const edges: SuggestedMappingEdge[] = [];
  const seen = new Set<string>();

  for (const clause of clauses) {
    const edge = clauseToEdge(clause, apps);
    if (!edge) continue;
    const key = `${edge.sourceApp}|${edge.sourceEnv}|${edge.targetApp}|${edge.targetEnv}`;
    if (seen.has(key)) continue;
    seen.add(key);
    edges.push(edge);
  }

  if (!edges.length) {
    const mentioned = apps.filter((a) => notes.toLowerCase().includes(a.name.toLowerCase()));
    if (mentioned.length >= 2) {
      const [sourceApp, targetApp] = mentioned;
      edges.push({
        sourceApp: sourceApp.name,
        sourceEnv: matchEnvironment(sourceApp, notes).name,
        targetApp: targetApp.name,
        targetEnv: matchEnvironment(targetApp, notes).name,
        direction: "downstream",
        notes: notes.slice(0, 240),
      });
    }
  }

  return edges;
}

export function resolveMappingEdge(
  suggestion: SuggestedMappingEdge,
  apps: AppRow[]
): {
  sourceAppId: string;
  sourceEnvId: string;
  targetAppId: string;
  targetEnvId: string;
} | null {
  const sourceApp = apps.find((a) => a.name.toLowerCase() === suggestion.sourceApp.toLowerCase());
  const targetApp = apps.find((a) => a.name.toLowerCase() === suggestion.targetApp.toLowerCase());
  if (!sourceApp || !targetApp) return null;

  const sourceEnv = sourceApp.environments.find(
    (e) =>
      e.name.toLowerCase().includes(suggestion.sourceEnv.toLowerCase()) ||
      e.type.toLowerCase() === suggestion.sourceEnv.toLowerCase() ||
      suggestion.sourceEnv.toLowerCase().includes(e.type.toLowerCase())
  );
  const targetEnv = targetApp.environments.find(
    (e) =>
      e.name.toLowerCase().includes(suggestion.targetEnv.toLowerCase()) ||
      e.type.toLowerCase() === suggestion.targetEnv.toLowerCase() ||
      suggestion.targetEnv.toLowerCase().includes(e.type.toLowerCase())
  );
  if (!sourceEnv || !targetEnv) return null;

  return {
    sourceAppId: sourceApp.id,
    sourceEnvId: sourceEnv.id,
    targetAppId: targetApp.id,
    targetEnvId: targetEnv.id,
  };
}
