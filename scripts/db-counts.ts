import { PrismaClient } from "@prisma/client";

const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
console.log("Connecting via", url?.includes("pooler") ? "pooler" : "direct", "...");

const p = new PrismaClient({
  datasources: { db: { url } },
});

const timeout = setTimeout(() => {
  console.error("TIMEOUT after 25s");
  process.exit(2);
}, 25000);

async function main() {
  const n = await p.$queryRawUnsafe<Array<{ c: bigint }>>(`SELECT COUNT(*)::bigint AS c FROM "Release"`);
  console.log("Release count raw:", Number(n[0].c));

  const tables = [
    "Department",
    "Application",
    "Environment",
    "EnvironmentVersion",
    "User",
    "Release",
    "CalendarEvent",
    "EnvBooking",
    "Risk",
    "RiskFactor",
    "Drift",
    "Approval",
    "LeaveRecord",
    "MonitoringAlert",
    "Incident",
    "ApplicationStatus",
    "PlannedMaintenance",
    "ReferenceData",
    "ReleaseDependency",
    "SystemMappingEdge",
  ];
  const counts: Record<string, number> = {};
  for (const t of tables) {
    const r = await p.$queryRawUnsafe<Array<{ c: bigint }>>(`SELECT COUNT(*)::bigint AS c FROM "${t}"`);
    counts[t] = Number(r[0].c);
  }
  console.log(JSON.stringify(counts, null, 2));

  const rel = await p.$queryRawUnsafe(
    `SELECT "releaseCode", "conflictId", "conflictingRelease", "conflictType", "externalDependencies", "releaseHealth"
     FROM "Release" WHERE "releaseCode" = 'REL-0001' LIMIT 1`
  );
  console.log("REL-0001:", rel);

  const cal = await p.$queryRawUnsafe(
    `SELECT "applicationName", "departmentName", title FROM "CalendarEvent" LIMIT 1`
  );
  console.log("calendar sample:", cal);

  const book = await p.$queryRawUnsafe(
    `SELECT "bookingCode", "environmentConflictId" FROM "EnvBooking" WHERE "bookingCode" = 'ENV-0001' LIMIT 1`
  );
  console.log("ENV-0001:", book);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    clearTimeout(timeout);
    await p.$disconnect();
  });
