/**
 * Analyze ReleaseDesk_SampleData Excel vs seed JSON vs live DB.
 * Run: npx tsx scripts/analyze-excel-vs-db.ts
 */
import fs from "fs";
import path from "path";
import XLSX from "xlsx";
import { PrismaClient } from "@prisma/client";

const EXCEL = path.join(process.cwd(), "public", "ReleaseDesk_SampleData_V0.5_07072026.xlsx");
const SEED_DIR = path.join(process.cwd(), "prisma", "seed-data");

const ID_PATTERNS: Record<string, RegExp> = {
  Releases: /^REL-\d+/i,
  Risk: /^RSK-\d+/i,
  Drift: /^DFT-\d+/i,
  Dependencies: /^DEP-\d+/i,
  Approvals: /^APR-\d+/i,
  "Monitoring Alerts": /^ALT-\d+/i,
  Incidents: /^INC-\d+/i,
  "Planned Maintenance": /^MNT-\d+/i,
  "Env booking": /^ENV-/i,
  "Environment Conflicts": /^CNF-/i,
  "Leave Calendar": /^LVE-/i,
};

const DOC_MARKERS = /QUICK\s*REFERENCE|FULL\s*DOCUMENTATION|📚|📖|ℹ️|HOW\s+TO\s+USE|FIELD\s+DEFINITIONS|COLUMN\s+GUIDE/i;

type SheetAnalysis = {
  sheet: string;
  headerRow: number;
  headers: string[];
  realRowCount: number;
  sampleIds: string[];
  firstDocRow: number | null;
  method: string;
};

function sheetToRows(ws: XLSX.WorkSheet): unknown[][] {
  return XLSX.utils.sheet_to_json(ws, { header: 1, defval: "", raw: false }) as unknown[][];
}

function cellStr(v: unknown): string {
  return String(v ?? "").trim();
}

function findHeaderRow(rows: unknown[][], hints: string[]): number {
  for (let i = 0; i < Math.min(rows.length, 30); i++) {
    const row = rows[i].map(cellStr);
    const joined = row.join("|").toLowerCase();
    const hits = hints.filter((h) => joined.includes(h.toLowerCase())).length;
    if (hits >= Math.min(2, hints.length)) return i;
  }
  return 0;
}

function isDocRow(row: unknown[]): boolean {
  const cells = row.map(cellStr).filter(Boolean);
  if (cells.length === 0) return false;
  const first = cells[0];
  if (DOC_MARKERS.test(first) || DOC_MARKERS.test(cells.join(" "))) return true;
  // Long prose in first cell with few filled columns often = docs
  if (first.length > 80 && cells.length <= 3) return true;
  if (/^(note|notes|tip|example|legend|key):/i.test(first)) return true;
  return false;
}

function analyzeIdSheet(sheetName: string, rows: unknown[][], idPattern: RegExp, idColHints: string[]): SheetAnalysis {
  // Find header: row that contains an ID-like header near a matching data row
  let headerRow = -1;
  let idCol = -1;
  for (let i = 0; i < Math.min(rows.length, 40); i++) {
    const row = rows[i].map(cellStr);
    for (let c = 0; c < row.length; c++) {
      const h = row[c].toLowerCase();
      if (idColHints.some((hint) => h.includes(hint)) || h === "id" || /id$/.test(h)) {
        // peek next non-empty rows for pattern
        for (let j = i + 1; j < Math.min(i + 5, rows.length); j++) {
          const v = cellStr(rows[j][c]);
          if (idPattern.test(v)) {
            headerRow = i;
            idCol = c;
            break;
          }
        }
      }
      if (headerRow >= 0) break;
    }
    if (headerRow >= 0) break;
  }

  // Fallback: scan all cells for ID pattern and infer header as previous non-empty row
  if (headerRow < 0) {
    for (let i = 0; i < rows.length; i++) {
      for (let c = 0; c < rows[i].length; c++) {
        if (idPattern.test(cellStr(rows[i][c]))) {
          idCol = c;
          headerRow = Math.max(0, i - 1);
          break;
        }
      }
      if (idCol >= 0) break;
    }
  }

  const headers = headerRow >= 0 ? rows[headerRow].map(cellStr).filter((_, idx) => {
    // keep all non-empty header labels; pad later
    return true;
  }) : [];
  const cleanHeaders = headers.map((h, i) => h || `__col${i}`);

  const ids: string[] = [];
  let firstDocRow: number | null = null;
  for (let i = headerRow + 1; i < rows.length; i++) {
    const id = cellStr(rows[i][idCol]);
    if (idPattern.test(id)) {
      ids.push(id);
      continue;
    }
    if (isDocRow(rows[i]) && ids.length > 0 && firstDocRow === null) {
      firstDocRow = i;
    }
  }

  return {
    sheet: sheetName,
    headerRow,
    headers: cleanHeaders.filter((h) => !h.startsWith("__col") || headers.some(Boolean)),
    realRowCount: ids.length,
    sampleIds: ids.slice(0, 5),
    firstDocRow,
    method: `id-pattern ${idPattern}`,
  };
}

function analyzeUntilDoc(sheetName: string, rows: unknown[][], headerHints: string[]): SheetAnalysis {
  const headerRow = findHeaderRow(rows, headerHints);
  const headers = rows[headerRow].map(cellStr);
  let count = 0;
  let firstDocRow: number | null = null;
  const samples: string[] = [];
  for (let i = headerRow + 1; i < rows.length; i++) {
    const row = rows[i];
    const filled = row.map(cellStr).filter(Boolean);
    if (filled.length === 0) continue;
    if (isDocRow(row)) {
      firstDocRow = i;
      break;
    }
    // Skip rows that are mostly empty in key columns
    if (filled.length < 2) continue;
    count++;
    if (samples.length < 5) samples.push(filled[0]);
  }
  return {
    sheet: sheetName,
    headerRow,
    headers: headers.filter(Boolean),
    realRowCount: count,
    sampleIds: samples,
    firstDocRow,
    method: "until-doc",
  };
}

function analyzeReferenceData(rows: unknown[][]): SheetAnalysis & { categories: Record<string, number> } {
  // Reference Data typically has Category / Value columns
  const headerRow = findHeaderRow(rows, ["category", "value", "sort"]);
  const headers = rows[headerRow].map(cellStr);
  const catIdx = headers.findIndex((h) => /category/i.test(h));
  const valIdx = headers.findIndex((h) => /^value$/i.test(h) || /value/i.test(h));
  const categories: Record<string, number> = {};
  let count = 0;
  let firstDocRow: number | null = null;
  for (let i = headerRow + 1; i < rows.length; i++) {
    const row = rows[i];
    if (isDocRow(row)) {
      firstDocRow = i;
      break;
    }
    const cat = cellStr(row[catIdx >= 0 ? catIdx : 0]);
    const val = cellStr(row[valIdx >= 0 ? valIdx : 1]);
    if (!cat || !val) continue;
    if (DOC_MARKERS.test(cat) || DOC_MARKERS.test(val)) {
      firstDocRow = i;
      break;
    }
    count++;
    categories[cat] = (categories[cat] ?? 0) + 1;
  }
  return {
    sheet: "Reference Data",
    headerRow,
    headers: headers.filter(Boolean),
    realRowCount: count,
    sampleIds: Object.keys(categories).slice(0, 8),
    firstDocRow,
    method: "until-doc-ref",
    categories,
  };
}

function analyzeApplications(rows: unknown[][]): SheetAnalysis & { envCount: number } {
  // Applications sheet often has app rows + nested env info
  const headerRow = findHeaderRow(rows, ["application", "department", "owner"]);
  const headers = rows[headerRow].map(cellStr);
  const appIdx = headers.findIndex((h) => /application/i.test(h) && !/owner/i.test(h));
  const apps = new Set<string>();
  let envCount = 0;
  let firstDocRow: number | null = null;
  for (let i = headerRow + 1; i < rows.length; i++) {
    if (isDocRow(rows[i])) {
      firstDocRow = i;
      break;
    }
    const app = cellStr(rows[i][appIdx >= 0 ? appIdx : 0]);
    if (!app) continue;
    if (app.length > 60) {
      firstDocRow = i;
      break;
    }
    apps.add(app);
    envCount++; // each row may be an env line under an app — count non-empty rows as env-ish
  }
  return {
    sheet: "Applications",
    headerRow,
    headers: headers.filter(Boolean),
    realRowCount: apps.size,
    sampleIds: [...apps].slice(0, 5),
    firstDocRow,
    method: "unique-apps",
    envCount,
  };
}

function analyzeUsers(rows: unknown[][]): SheetAnalysis {
  const headerRow = findHeaderRow(rows, ["email", "name", "role"]);
  const headers = rows[headerRow].map(cellStr);
  const emailIdx = headers.findIndex((h) => /email/i.test(h));
  let count = 0;
  const samples: string[] = [];
  let firstDocRow: number | null = null;
  for (let i = headerRow + 1; i < rows.length; i++) {
    if (isDocRow(rows[i])) {
      firstDocRow = i;
      break;
    }
    const email = cellStr(rows[i][emailIdx >= 0 ? emailIdx : 1]);
    if (!email || !email.includes("@")) {
      if (email && email.length > 40) {
        firstDocRow = i;
        break;
      }
      continue;
    }
    count++;
    if (samples.length < 5) samples.push(email);
  }
  return {
    sheet: "Users",
    headerRow,
    headers: headers.filter(Boolean),
    realRowCount: count,
    sampleIds: samples,
    firstDocRow,
    method: "email-rows",
  };
}

function analyzeVersions(rows: unknown[][]): SheetAnalysis {
  const headerRow = findHeaderRow(rows, ["application", "environment", "version"]);
  const headers = rows[headerRow].map(cellStr);
  let count = 0;
  const samples: string[] = [];
  let firstDocRow: number | null = null;
  for (let i = headerRow + 1; i < rows.length; i++) {
    if (isDocRow(rows[i])) {
      firstDocRow = i;
      break;
    }
    const filled = rows[i].map(cellStr).filter(Boolean);
    if (filled.length < 2) continue;
    if (filled[0].length > 60) {
      firstDocRow = i;
      break;
    }
    count++;
    if (samples.length < 5) samples.push(filled.slice(0, 3).join(" / "));
  }
  return {
    sheet: "Versions",
    headerRow,
    headers: headers.filter(Boolean),
    realRowCount: count,
    sampleIds: samples,
    firstDocRow,
    method: "until-doc",
  };
}

function analyzeSystemMapping(rows: unknown[][]): SheetAnalysis {
  const headerRow = findHeaderRow(rows, ["source", "target", "system", "from", "to"]);
  const headers = rows[headerRow].map(cellStr);
  let count = 0;
  const samples: string[] = [];
  let firstDocRow: number | null = null;
  for (let i = headerRow + 1; i < rows.length; i++) {
    if (isDocRow(rows[i])) {
      firstDocRow = i;
      break;
    }
    const filled = rows[i].map(cellStr).filter(Boolean);
    if (filled.length < 2) continue;
    if (filled[0].length > 80) {
      firstDocRow = i;
      break;
    }
    count++;
    if (samples.length < 5) samples.push(filled.slice(0, 2).join(" → "));
  }
  return {
    sheet: "System Mapping",
    headerRow,
    headers: headers.filter(Boolean),
    realRowCount: count,
    sampleIds: samples,
    firstDocRow,
    method: "until-doc",
  };
}

function analyzeRiskFactors(rows: unknown[][]): SheetAnalysis {
  const headerRow = findHeaderRow(rows, ["factor", "category", "weight"]);
  const headers = rows[headerRow].map(cellStr);
  let count = 0;
  const samples: string[] = [];
  let firstDocRow: number | null = null;
  for (let i = headerRow + 1; i < rows.length; i++) {
    if (isDocRow(rows[i])) {
      firstDocRow = i;
      break;
    }
    const filled = rows[i].map(cellStr).filter(Boolean);
    if (filled.length < 2) continue;
    if (filled[0].length > 60) {
      firstDocRow = i;
      break;
    }
    count++;
    if (samples.length < 5) samples.push(filled[0]);
  }
  return {
    sheet: "Risk Factors",
    headerRow,
    headers: headers.filter(Boolean),
    realRowCount: count,
    sampleIds: samples,
    firstDocRow,
    method: "until-doc",
  };
}

function loadSeedCount(file: string, pick?: (rows: any[]) => number): number | null {
  const p = path.join(SEED_DIR, file);
  if (!fs.existsSync(p)) return null;
  const data = JSON.parse(fs.readFileSync(p, "utf-8"));
  if (!Array.isArray(data)) return null;
  return pick ? pick(data) : data.length;
}

async function main() {
  const wb = XLSX.readFile(EXCEL);
  console.log("=== EXCEL SHEETS ===");
  console.log(wb.SheetNames.join("\n"));

  const analyses: SheetAnalysis[] = [];

  const feedSheets: Array<() => SheetAnalysis> = [
    () => analyzeUntilDoc("Reference Data", sheetToRows(wb.Sheets["Reference Data"]), ["category", "value"]),
    () => analyzeRiskFactors(sheetToRows(wb.Sheets["Risk Factors"])),
    () => analyzeApplications(sheetToRows(wb.Sheets["Applications"])),
    () => analyzeUsers(sheetToRows(wb.Sheets["Users"])),
    () => analyzeIdSheet("Releases", sheetToRows(wb.Sheets["Releases"]), /^REL-\d+/i, ["release id", "releaseid", "id"]),
    () => analyzeUntilDoc("Calendar", sheetToRows(wb.Sheets["Calendar"]), ["date", "event", "release"]),
    () => analyzeIdSheet("Env booking", sheetToRows(wb.Sheets["Env booking"]), /^ENV-/i, ["booking", "env", "id"]),
    () => analyzeIdSheet("Environment Conflicts", sheetToRows(wb.Sheets["Environment Conflicts"]), /^CNF-/i, ["conflict", "id"]),
    () => analyzeIdSheet("Risk", sheetToRows(wb.Sheets["Risk"]), /^RSK-\d+/i, ["risk", "id"]),
    () => analyzeIdSheet("Drift", sheetToRows(wb.Sheets["Drift"]), /^DFT-\d+/i, ["drift", "id"]),
    () => analyzeIdSheet("Dependencies", sheetToRows(wb.Sheets["Dependencies"]), /^DEP-\d+/i, ["dep", "id"]),
    () => analyzeIdSheet("Approvals", sheetToRows(wb.Sheets["Approvals"]), /^APR-\d+/i, ["approval", "id"]),
    () => analyzeIdSheet("Leave Calendar", sheetToRows(wb.Sheets["Leave Calendar"]), /^LVE-/i, ["leave", "id"]),
    () => analyzeVersions(sheetToRows(wb.Sheets["Versions"])),
    () => analyzeSystemMapping(sheetToRows(wb.Sheets["System Mapping"])),
    () => analyzeIdSheet("Monitoring Alerts", sheetToRows(wb.Sheets["Monitoring Alerts"]), /^ALT-\d+/i, ["alert", "id"]),
    () => analyzeIdSheet("Incidents", sheetToRows(wb.Sheets["Incidents"]), /^INC-\d+/i, ["incident", "id"]),
    () => analyzeUntilDoc("Application Status", sheetToRows(wb.Sheets["Application Status"]), ["application", "status", "environment"]),
    () => analyzeIdSheet("Planned Maintenance", sheetToRows(wb.Sheets["Planned Maintenance"]), /^MNT-\d+/i, ["maintenance", "id", "mnt"]),
  ];

  // Override Reference Data with category breakdown
  const ref = analyzeReferenceData(sheetToRows(wb.Sheets["Reference Data"]));

  console.log("\n=== SHEET ANALYSIS ===");
  for (const fn of feedSheets) {
    try {
      const a = fn();
      if (a.sheet === "Reference Data") {
        analyses.push(ref);
        console.log(JSON.stringify(ref, null, 2));
      } else {
        analyses.push(a);
        console.log(
          `${a.sheet}: count=${a.realRowCount} headerRow=${a.headerRow} method=${a.method} headers=${a.headers.slice(0, 12).join(" | ")} samples=${a.sampleIds.join(", ")}`
        );
      }
    } catch (e) {
      console.error("FAIL", e);
    }
  }

  // Dump full headers for key sheets that may have new columns
  console.log("\n=== FULL HEADERS (key sheets) ===");
  for (const name of ["Risk", "Drift", "Approvals", "Calendar", "Releases", "Env booking", "Dependencies", "Incidents"]) {
    const a = analyses.find((x) => x.sheet === name);
    if (a) console.log(`${name}:\n  ${a.headers.join("\n  ")}`);
  }

  // Seed JSON counts
  console.log("\n=== SEED JSON COUNTS ===");
  const seedFiles: Array<[string, string, ((d: any[]) => number)?]> = [
    ["departments", "departments.json"],
    ["applications", "applications.json"],
    ["releases", "releases.json"],
    ["calendar", "calendar.json"],
    ["env_booking", "env_booking.json"],
    ["conflicts", "conflicts.json"],
    ["risk", "risk.json"],
    ["drift", "drift.json"],
    ["dependencies", "dependencies.json"],
    ["approvals", "approvals.json"],
    ["leave_calendar", "leave_calendar.json"],
    ["versions", "versions.json"],
    ["users", "users.json"],
    ["incidents", "incidents.json"],
    ["monitoring-alerts", "monitoring-alerts.json"],
    ["application-status", "application-status.json"],
    ["planned-maintenance", "planned-maintenance.json"],
    ["risk_factors", "risk_factors_NO_SCHEMA_TARGET.json"],
  ];
  for (const [label, file, pick] of seedFiles) {
    console.log(`${label}: ${loadSeedCount(file, pick)}`);
  }

  // Live DB
  const prisma = new PrismaClient();
  try {
    console.log("\n=== LIVE DB COUNTS ===");
    const counts = {
      Department: await prisma.department.count(),
      Application: await prisma.application.count(),
      Environment: await prisma.environment.count(),
      EnvironmentVersion: await prisma.environmentVersion.count(),
      User: await prisma.user.count(),
      Release: await prisma.release.count(),
      CalendarEvent: await prisma.calendarEvent.count(),
      EnvBooking: await prisma.envBooking.count(),
      Risk: await prisma.risk.count(),
      RiskFactor: await prisma.riskFactor.count(),
      Drift: await prisma.drift.count(),
      Approval: await prisma.approval.count(),
      LeaveRecord: await prisma.leaveRecord.count(),
      MonitoringAlert: await prisma.monitoringAlert.count(),
      Incident: await prisma.incident.count(),
      ApplicationStatus: await prisma.applicationStatus.count(),
      PlannedMaintenance: await prisma.plannedMaintenance.count(),
      ReferenceData: await prisma.referenceData.count(),
      ReleaseDependency: await prisma.releaseDependency.count(),
      SystemMappingEdge: await prisma.systemMappingEdge.count(),
      SystemMappingGroup: await prisma.systemMappingGroup.count(),
    };
    console.log(JSON.stringify(counts, null, 2));

    // Sample codes for ID-based tables
    console.log("\n=== DB SAMPLE CODES ===");
    console.log(
      "releases",
      (await prisma.release.findMany({ select: { releaseCode: true }, take: 5, orderBy: { releaseCode: "asc" } })).map((r) => r.releaseCode)
    );
    console.log(
      "risks",
      (await prisma.risk.findMany({ select: { riskCode: true }, take: 5, orderBy: { riskCode: "asc" } })).map((r) => r.riskCode)
    );
    console.log(
      "drifts",
      (await prisma.drift.findMany({ select: { driftCode: true }, take: 5, orderBy: { driftCode: "asc" } })).map((r) => r.driftCode)
    );
  } catch (e) {
    console.error("DB ERROR", e);
  } finally {
    await prisma.$disconnect();
  }

  // Write analysis JSON for follow-up
  fs.writeFileSync(
    path.join(process.cwd(), "scripts", "excel-analysis-out.json"),
    JSON.stringify({ analyses, refCategories: (ref as any).categories }, null, 2)
  );
  console.log("\nWrote scripts/excel-analysis-out.json");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
