import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/api";
import { completeChat } from "@/lib/llm";
import {
  parseNotesToMappingEdges,
  resolveMappingEdge,
  type SuggestedMappingEdge,
} from "@/lib/mapping-from-notes";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { error } = await requireRole("editor");
  if (error) return error;

  const { notes } = (await req.json()) as { notes?: string };
  if (!notes?.trim()) {
    return NextResponse.json({ error: "notes required" }, { status: 400 });
  }

  const apps = await prisma.application.findMany({ include: { environments: true, department: true } });
  const catalog = apps.map((a) => ({
    app: a.name,
    department: a.department.name,
    envs: a.environments.map((e) => ({ name: e.name, type: e.type, id: e.id })),
    appId: a.id,
  }));

  let suggestions: SuggestedMappingEdge[] = parseNotesToMappingEdges(notes, apps);
  let usedAi = false;
  let message = "";

  const hasLlm = !!(process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY);

  if (!suggestions.length && hasLlm) {
    try {
      const { text: raw } = await completeChat({
        system: "You are a release desk system mapping assistant. Output ONLY a valid JSON array, no markdown.",
        messages: [
          {
            role: "user",
            content: `Given user notes, output a JSON array of mapping edges.
Each edge: { "sourceApp", "sourceEnv", "targetApp", "targetEnv", "direction": "downstream"|"upstream", "notes" }
Use only application and environment names from this catalog:
${JSON.stringify(catalog, null, 2)}

User notes:
${notes}`,
          },
        ],
        timeoutMs: 12_000,
      });
      const parsed = JSON.parse(raw.replace(/```json\n?|\n?```/g, "").trim()) as SuggestedMappingEdge[];
      if (Array.isArray(parsed) && parsed.length) {
        suggestions = parsed;
        usedAi = true;
      }
    } catch {
      // keep empty suggestions
    }
  } else if (suggestions.length && hasLlm) {
    try {
      const { text: raw } = await completeChat({
        system: "You are a release desk system mapping assistant. Output ONLY a valid JSON array, no markdown.",
        messages: [
          {
            role: "user",
            content: `Refine this mapping based on user notes. Output a JSON array of edges.
Each edge: { "sourceApp", "sourceEnv", "targetApp", "targetEnv", "direction": "downstream"|"upstream", "notes" }
Catalog:
${JSON.stringify(catalog, null, 2)}

User notes:
${notes}`,
          },
        ],
        timeoutMs: 12_000,
      });
      const parsed = JSON.parse(raw.replace(/```json\n?|\n?```/g, "").trim()) as SuggestedMappingEdge[];
      if (Array.isArray(parsed) && parsed.length) {
        suggestions = parsed;
        usedAi = true;
      }
    } catch {
      // keep rule-based suggestions
    }
  }

  const resolved: {
    sourceApp: string;
    sourceEnv: string;
    targetApp: string;
    targetEnv: string;
    direction: string;
    notes?: string;
    sourceAppId: string;
    sourceEnvId: string;
    targetAppId: string;
    targetEnvId: string;
  }[] = [];
  const skipped: string[] = [];

  for (const s of suggestions) {
    const ids = resolveMappingEdge(s, apps);
    if (!ids) {
      skipped.push(`${s.sourceApp}/${s.sourceEnv} → ${s.targetApp}/${s.targetEnv}`);
      continue;
    }
    const sourceApp = apps.find((a) => a.id === ids.sourceAppId)!;
    const targetApp = apps.find((a) => a.id === ids.targetAppId)!;
    const sourceEnv = sourceApp.environments.find((e) => e.id === ids.sourceEnvId)!;
    const targetEnv = targetApp.environments.find((e) => e.id === ids.targetEnvId)!;
    resolved.push({
      sourceApp: sourceApp.name,
      sourceEnv: sourceEnv.name,
      targetApp: targetApp.name,
      targetEnv: targetEnv.name,
      direction: s.direction ?? "downstream",
      notes: s.notes,
      ...ids,
    });
  }

  if (!resolved.length) {
    return NextResponse.json(
      {
        error:
          "Could not match applications in your notes. Use names from reference data (SAP, FIN, CRM, Oracle) and env types like Dev, Test, or UAT.",
        resolved: [],
        suggestions,
        skipped,
        usedAi,
      },
      { status: 422 }
    );
  }

  if (usedAi) {
    message = `Generated ${resolved.length} suggested edge${resolved.length === 1 ? "" : "s"} using AI. Review and save when ready.`;
  } else {
    message = `Generated ${resolved.length} suggested edge${resolved.length === 1 ? "" : "s"} from your notes. Review and save when ready.`;
  }

  return NextResponse.json({
    resolved,
    suggestions,
    skipped,
    usedAi,
    message,
  });
}
