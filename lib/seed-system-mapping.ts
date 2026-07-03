import fs from "fs";
import path from "path";
import type { PrismaClient } from "@prisma/client";

const MATRIX_MARKER = "From \\ To";
const PRIMARY = "\u25cf"; // ●
const SECONDARY = "\u25cb"; // ○

function pickIntegrationEnv(envs: { id: string; name: string }[]) {
  for (const name of ["Test", "UAT", "Pre-prod", "Prod", "Dev"]) {
    const env = envs.find((e) => e.name.toLowerCase() === name.toLowerCase());
    if (env) return env;
  }
  return envs[0];
}

/** Primary app per department — first seeded row (createdAt asc) matches workbook order. */
function primaryAppByDepartment(
  apps: {
    id: string;
    name: string;
    department: { name: string };
    environments: { id: string; name: string }[];
  }[]
) {
  const map = new Map<string, (typeof apps)[0]>();
  for (const app of apps) {
    if (!map.has(app.department.name)) map.set(app.department.name, app);
  }
  return map;
}

/**
 * Builds SystemMappingEdge rows from the workbook's Department Integration Matrix
 * (system_mapping_RAW_NO_SCHEMA_TARGET.json). Uses the first application per
 * department on Test env — documented in SEED_NOTES as the closest match to the
 * narrative integration map without inventing app-pair relationships.
 */
export async function seedSystemMapping(prisma: PrismaClient) {
  await prisma.systemMappingEdge.deleteMany();
  await prisma.systemMappingGroup.deleteMany();

  const apps = await prisma.application.findMany({
    include: { department: true, environments: true },
    orderBy: [{ department: { name: "asc" } }, { createdAt: "asc" }],
  });

  if (!apps.length) {
    console.log("System Mapping: skipped (no applications)");
    return;
  }

  const byDept = primaryAppByDepartment(apps);
  const rawPath = path.join(process.cwd(), "prisma", "seed-data", "system_mapping_RAW_NO_SCHEMA_TARGET.json");

  if (!fs.existsSync(rawPath)) {
    console.log("System Mapping: skipped (raw matrix JSON not found)");
    return;
  }

  const rawText = fs.readFileSync(rawPath, "utf-8").replace(/\bNaN\b/g, "null");
  const raw = JSON.parse(rawText) as unknown[][];
  const headerIdx = raw.findIndex((row) => row[0] === MATRIX_MARKER);
  if (headerIdx < 0) {
    console.log("System Mapping: skipped (department matrix not found in raw JSON)");
    return;
  }

  const header = raw[headerIdx] as string[];
  const edgeData: {
    sourceAppId: string;
    sourceEnvId: string;
    targetAppId: string;
    targetEnvId: string;
    direction: string;
    notes: string;
  }[] = [];

  const seen = new Set<string>();

  for (let i = headerIdx + 1; i < raw.length; i++) {
    const row = raw[i] as unknown[];
    const fromDept = row[0];
    if (typeof fromDept !== "string") break;
    if (fromDept.includes("Primary Integration") || fromDept.includes("Secondary")) break;

    const sourceApp = byDept.get(fromDept);
    if (!sourceApp) continue;
    const sourceEnv = pickIntegrationEnv(sourceApp.environments);
    if (!sourceEnv) continue;

    for (let j = 1; j < row.length && j < header.length; j++) {
      const cell = row[j];
      const toDept = header[j];
      if (typeof toDept !== "string" || fromDept === toDept) continue;
      if (cell !== PRIMARY && cell !== SECONDARY) continue;

      const targetApp = byDept.get(toDept);
      if (!targetApp) continue;
      const targetEnv = pickIntegrationEnv(targetApp.environments);
      if (!targetEnv) continue;

      const key = `${sourceApp.id}:${sourceEnv.id}->${targetApp.id}:${targetEnv.id}`;
      if (seen.has(key)) continue;
      seen.add(key);

      edgeData.push({
        sourceAppId: sourceApp.id,
        sourceEnvId: sourceEnv.id,
        targetAppId: targetApp.id,
        targetEnvId: targetEnv.id,
        direction: "downstream",
        notes: `${fromDept} → ${toDept} (${cell === PRIMARY ? "Primary" : "Secondary"} · ${sourceEnv.name})`,
      });
    }
  }

  if (!edgeData.length) {
    console.log("System Mapping: no edges parsed from matrix");
    return;
  }

  await prisma.systemMappingGroup.create({
    data: {
      name: "Enterprise Default Setup",
      status: "accepted",
      sourceNotes:
        "Department Integration Matrix from ReleaseDesk_SampleData.xlsx (● primary / ○ secondary). One representative application per department on Test environment.",
      edges: {
        create: edgeData.map((e) => ({ ...e, isDefault: true })),
      },
    },
  });

  console.log(`System Mapping: 1 group, ${edgeData.length} edges`);
}
