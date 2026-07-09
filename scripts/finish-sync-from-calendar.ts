/**
 * Finish sync from Calendar onward (after earlier sections already applied).
 * Run: npx tsx scripts/finish-sync-from-calendar.ts
 */
import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { APPLICATION_NAME_ALIASES } from "../prisma/seed-data/app-name-aliases";

const prisma = new PrismaClient();
const DATA_DIR = path.join(process.cwd(), "prisma", "seed-data");
const DATA = (f: string) => JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), "utf-8"));

const toDate = (v: unknown): Date | null => (v ? new Date(String(v)) : null);
const toFloat = (v: unknown): number | undefined => {
  if (v === null || v === undefined || v === "") return undefined;
  const n = Number(String(v).replace("%", ""));
  return Number.isFinite(n) ? n : undefined;
};
const cryptoRandomId = () =>
  `cm${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;

function resolveAppId(rawName: string, appIdByName: Map<string, string>): string | undefined {
  if (appIdByName.has(rawName)) return appIdByName.get(rawName);
  const alias = APPLICATION_NAME_ALIASES[rawName];
  if (alias && appIdByName.has(alias)) return appIdByName.get(alias);
  for (const [name, id] of appIdByName) {
    if (name.startsWith(rawName) || rawName.startsWith(name)) return id;
  }
  return undefined;
}

async function upsertByCode<T extends { id: string }>(
  find: () => Promise<T | null>,
  create: () => Promise<T>,
  update: (id: string) => Promise<T>
): Promise<T> {
  const existing = await find();
  if (existing) return update(existing.id);
  return create();
}

async function main() {
  const orgRows = await prisma.$queryRawUnsafe<{ organizationId: string }[]>(
    `SELECT "organizationId" FROM "User" WHERE "organizationId" IS NOT NULL LIMIT 1`
  );
  const organizationId = orgRows[0]?.organizationId;
  if (!organizationId) throw new Error("No organizationId");

  const releaseIdByCode = new Map<string, string>();
  for (const r of await prisma.release.findMany({ select: { id: true, releaseCode: true } })) {
    releaseIdByCode.set(r.releaseCode, r.id);
  }
  const appIdByName = new Map<string, string>();
  for (const a of await prisma.application.findMany()) appIdByName.set(a.name, a.id);
  const envIdByAppEnv = new Map<string, string>();
  for (const e of await prisma.environment.findMany()) {
    envIdByAppEnv.set(`${e.applicationId}::${e.name}`, e.id);
    envIdByAppEnv.set(`${e.applicationId}::${e.type}`, e.id);
  }

  console.log("Restoring calendar...");
  await prisma.$executeRawUnsafe(`DELETE FROM "CalendarEvent"`);
  for (const c of DATA("calendar.json")) {
    const releaseId = c["Release ID"] ? releaseIdByCode.get(c["Release ID"]) ?? null : null;
    await prisma.$executeRawUnsafe(
      `INSERT INTO "CalendarEvent"
        (id, date, "eventType", "releaseId", title, "applicationName", "departmentName", "sizeImpact", notes, "organizationId", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())`,
      cryptoRandomId(),
      toDate(c["Date"]),
      String(c["Event Type"]),
      releaseId,
      String(c["Release Name"] ?? c["Event Type"]),
      c["Application"] ? String(c["Application"]) : null,
      c["Department"] ? String(c["Department"]) : null,
      c["Size/Impact"] ? String(c["Size/Impact"]) : null,
      c["Notes"] ? String(c["Notes"]) : null,
      organizationId
    );
  }
  console.log("Calendar Events replaced:", DATA("calendar.json").length);

  console.log("Versions...");
  for (const v of DATA("versions.json")) {
    const applicationId = resolveAppId(String(v["Application"] ?? ""), appIdByName);
    if (!applicationId) continue;
    const environmentId =
      envIdByAppEnv.get(`${applicationId}::${v["Environment"]}`) ??
      envIdByAppEnv.get(`${applicationId}::${String(v["Environment"]).toUpperCase()}`);
    if (!environmentId) continue;
    const existing = await prisma.environmentVersion.findFirst({
      where: { applicationId, environmentId, version: String(v["Version"]) },
    });
    const data = {
      updatedBy: v["Deployed By"] ? String(v["Deployed By"]) : null,
      buildNumber: v["Build Number"] ? String(v["Build Number"]) : null,
      deployDate: toDate(v["Deploy Date"]),
      status: v["Status"] ? String(v["Status"]) : null,
      notes: v["Notes"] ? String(v["Notes"]) : null,
    };
    if (existing) await prisma.environmentVersion.update({ where: { id: existing.id }, data });
    else {
      await prisma.environmentVersion.create({
        data: { applicationId, environmentId, version: String(v["Version"]), ...data },
      });
    }
  }
  console.log("versions done");

  console.log("Incidents...");
  for (const i of DATA("incidents.json")) {
    const applicationId = resolveAppId(String(i["Application"] ?? ""), appIdByName);
    if (!applicationId) continue;
    const data = {
      timestamp: toDate(i["Timestamp"])!,
      applicationId,
      departmentName: i["Department"] ? String(i["Department"]) : null,
      severity: String(i["Severity"]),
      title: String(i["Title"]),
      status: String(i["Status"]),
      impact: String(i["Impact"]),
      assignedTo: i["Assigned To"] ? String(i["Assigned To"]) : null,
      relatedReleaseCode: i["Related Release"] ? String(i["Related Release"]) : null,
      environmentName: String(i["Environment"] ?? ""),
    };
    await upsertByCode(
      () => prisma.incident.findFirst({ where: { incidentCode: String(i["Incident ID"]) } }),
      () => prisma.incident.create({ data: { incidentCode: i["Incident ID"], ...data } }),
      (id) => prisma.incident.update({ where: { id }, data })
    );
  }
  console.log("incidents done");

  console.log("Monitoring alerts...");
  for (const a of DATA("monitoring-alerts.json")) {
    const applicationId = resolveAppId(String(a["Application"] ?? ""), appIdByName);
    if (!applicationId) continue;
    const data = {
      timestamp: toDate(a["Timestamp"])!,
      applicationId,
      departmentName: a["Department"] ? String(a["Department"]) : null,
      alertType: String(a["Alert Type"]),
      severity: String(a["Severity"]),
      metric: String(a["Metric"]),
      threshold: a["Threshold"] != null ? String(a["Threshold"]) : null,
      currentValue: a["Current Value"] != null ? String(a["Current Value"]) : null,
      status: String(a["Status"]),
      assignedTo: a["Assigned To"] ? String(a["Assigned To"]) : null,
      environmentName: String(a["Environment"] ?? ""),
    };
    await upsertByCode(
      () => prisma.monitoringAlert.findFirst({ where: { alertCode: String(a["Alert ID"]) } }),
      () => prisma.monitoringAlert.create({ data: { alertCode: a["Alert ID"], ...data } }),
      (id) => prisma.monitoringAlert.update({ where: { id }, data })
    );
  }
  console.log("alerts done");

  console.log("Application status...");
  await prisma.applicationStatus.deleteMany({});
  for (const s of DATA("application-status.json")) {
    const applicationId = resolveAppId(String(s["Application"] ?? ""), appIdByName);
    if (!applicationId) continue;
    await prisma.applicationStatus.create({
      data: {
        applicationId,
        environmentName: String(s["Environment"]),
        status: String(s["Status"]),
        lastCheck: toDate(s["Last Check"]) ?? new Date(),
        uptimePercent: (() => {
          const uptime = toFloat(s["Uptime %"]);
          if (uptime == null) return null;
          return uptime <= 1 ? uptime * 100 : uptime;
        })(),
        notes: s["Notes"] ? String(s["Notes"]) : null,
      },
    });
  }
  console.log("ApplicationStatus replaced:", DATA("application-status.json").length);

  console.log("Planned maintenance...");
  for (const m of DATA("planned-maintenance.json")) {
    const appName = String(m["Application(s)"] ?? "").split(",")[0]?.trim();
    const applicationId = appName ? resolveAppId(appName, appIdByName) : null;
    const data = {
      scheduledDate: toDate(m["Scheduled Date"])!,
      startTime: String(m["Start Time"] ?? ""),
      endTime: String(m["End Time"] ?? ""),
      type: String(m["Type"]),
      applicationId: applicationId ?? null,
      environmentName: String(m["Environment(s)"] ?? "").split(",")[0]?.trim() || "Prod",
      departmentName: m["Department"] ? String(m["Department"]) : null,
      impact: String(m["Impact"] ?? ""),
      requestor: m["Requestor"] ? String(m["Requestor"]) : null,
      approvalStatus: String(m["Approval Status"] ?? ""),
      notes: m["Notes"] ? String(m["Notes"]) : null,
    };
    await upsertByCode(
      () =>
        prisma.plannedMaintenance.findFirst({
          where: { maintenanceCode: String(m["Maintenance ID"]) },
        }),
      () =>
        prisma.plannedMaintenance.create({
          data: { maintenanceCode: m["Maintenance ID"], ...data },
        }),
      (id) => prisma.plannedMaintenance.update({ where: { id }, data })
    );
  }
  console.log("maintenance done");

  console.log("Risk factors...");
  let rfOrder = 0;
  for (const f of DATA("risk_factors.json")) {
    rfOrder++;
    const existing = await prisma.riskFactor.findFirst({
      where: { factorName: String(f["Factor Name"]), category: String(f["Category"]) },
    });
    const data = {
      category: String(f["Category"]),
      factorName: String(f["Factor Name"]),
      weight: Number(f["Weight"]),
      description: f["Description"] ? String(f["Description"]) : null,
      active: true,
      order: rfOrder,
    };
    if (existing) await prisma.riskFactor.update({ where: { id: existing.id }, data });
    else await prisma.riskFactor.create({ data });
  }
  console.log("RiskFactors upserted:", DATA("risk_factors.json").length);

  const refSeed = ["Infrastructure", "Configuration", "Data", "Integration", "Security"].map(
    (v, i) => ({ category: "drift_type", value: v, sortOrder: i + 1 })
  );
  for (const r of refSeed) {
    await upsertByCode(
      () => prisma.referenceData.findFirst({ where: { category: r.category, value: r.value } }),
      () => prisma.referenceData.create({ data: { ...r, active: true } }),
      (id) =>
        prisma.referenceData.update({
          where: { id },
          data: { sortOrder: r.sortOrder, active: true },
        })
    );
  }

  const counts = {
    CalendarEvent: await prisma.calendarEvent.count(),
    EnvironmentVersion: await prisma.environmentVersion.count(),
    Incident: await prisma.incident.count(),
    MonitoringAlert: await prisma.monitoringAlert.count(),
    ApplicationStatus: await prisma.applicationStatus.count(),
    PlannedMaintenance: await prisma.plannedMaintenance.count(),
    RiskFactor: await prisma.riskFactor.count(),
    ReferenceData: await prisma.referenceData.count(),
    User: await prisma.user.count(),
    Risk: await prisma.risk.count(),
    Approval: await prisma.approval.count(),
    EnvBooking: await prisma.envBooking.count(),
  };
  console.log("FINISH COUNTS", JSON.stringify(counts, null, 2));

  const cal = await prisma.$queryRawUnsafe(
    `SELECT "applicationName", "departmentName", title FROM "CalendarEvent" WHERE "applicationName" IS NOT NULL LIMIT 1`
  );
  const risk = await prisma.$queryRawUnsafe(
    `SELECT "riskCode", "applicationName", "departmentName" FROM "Risk" ORDER BY "riskCode" LIMIT 1`
  );
  const book = await prisma.$queryRawUnsafe(
    `SELECT "bookingCode", "environmentConflictId" FROM "EnvBooking" WHERE "bookingCode"='ENV-0001'`
  );
  console.log("spot calendar:", cal);
  console.log("spot risk:", risk);
  console.log("spot booking:", book);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
