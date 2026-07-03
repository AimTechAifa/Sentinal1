import { prisma } from "../lib/prisma";

const EXPECTED: Record<string, number> = {
  Department: 8,
  Application: 84,
  Environment: 504,
  User: 100,
  Release: 80,
  CalendarEvent: 166,
  EnvBooking: 80,
  Risk: 31,
  Drift: 7,
  ReleaseDependency: 26,
  Approval: 27,
  LeaveRecord: 30,
  EnvironmentVersion: 180,
};

async function main() {
  const counts = {
    Department: await prisma.department.count(),
    Application: await prisma.application.count(),
    Environment: await prisma.environment.count(),
    User: await prisma.user.count(),
    Release: await prisma.release.count(),
    CalendarEvent: await prisma.calendarEvent.count(),
    EnvBooking: await prisma.envBooking.count(),
    Risk: await prisma.risk.count(),
    Drift: await prisma.drift.count(),
    ReleaseDependency: await prisma.releaseDependency.count(),
    Approval: await prisma.approval.count(),
    LeaveRecord: await prisma.leaveRecord.count(),
    EnvironmentVersion: await prisma.environmentVersion.count(),
  };

  let allOk = true;
  for (const [table, expected] of Object.entries(EXPECTED)) {
    const actual = counts[table as keyof typeof counts];
    const ok = actual === expected;
    if (!ok) allOk = false;
    console.log(`${table}: ${actual} (expected ${expected}) ${ok ? "OK" : "MISMATCH"}`);
  }

  if (!allOk) process.exit(1);
  console.log("All counts match.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
