import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();

async function main() {
  const counts = {
    departments: await p.department.count(),
    users: await p.user.count(),
    applications: await p.application.count(),
    environments: await p.environment.count(),
    releases: await p.release.count(),
    envBookings: await p.envBooking.count(),
    risks: await p.risk.count(),
    drifts: await p.drift.count(),
    approvals: await p.approval.count(),
    leaveRecords: await p.leaveRecord.count(),
    calendarEvents: await p.calendarEvent.count(),
    dependencies: await p.releaseDependency.count(),
    stakeholders: await p.releaseStakeholder.count(),
    envVersions: await p.environmentVersion.count(),
  };
  console.log("=== Database Record Counts ===");
  for (const [key, val] of Object.entries(counts)) {
    console.log(`  ${key}: ${val}`);
  }
  console.log(`\nTotal records: ${Object.values(counts).reduce((a, b) => a + b, 0)}`);
  await p.$disconnect();
}

main().catch(console.error);
