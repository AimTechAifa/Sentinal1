import { prisma } from "../lib/prisma";

const EXPECTED: Record<string, number | null> = {
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
  SystemMappingGroup: null,
  SystemMappingEdge: null,
  ReleaseApplication: null,
  ReleaseStakeholder: null,
  LeaveRecordRelease: null,
  ReleaseAuditEvent: null,
  Connector: null,
  ConnectorSyncLog: null,
  P1Issue: null,
  WorkItem: null,
  ReleaseDecisionState: null,
  DeploymentState: null,
  ReleaseHistoryEvent: null,
  AppNotificationRow: null,
  AgentPauseState: null,
};

async function main() {
  const counts: Record<string, number> = {
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
    SystemMappingGroup: await prisma.systemMappingGroup.count(),
    SystemMappingEdge: await prisma.systemMappingEdge.count(),
    ReleaseApplication: await prisma.releaseApplication.count(),
    ReleaseStakeholder: await prisma.releaseStakeholder.count(),
    LeaveRecordRelease: await prisma.leaveRecordRelease.count(),
    ReleaseAuditEvent: await prisma.releaseAuditEvent.count(),
    Connector: await prisma.connector.count(),
    ConnectorSyncLog: await prisma.connectorSyncLog.count(),
    P1Issue: await prisma.p1Issue.count(),
    WorkItem: await prisma.workItem.count(),
    ReleaseDecisionState: await prisma.releaseDecisionState.count(),
    DeploymentState: await prisma.deploymentState.count(),
    ReleaseHistoryEvent: await prisma.releaseHistoryEvent.count(),
    AppNotificationRow: await prisma.appNotificationRow.count(),
    AgentPauseState: await prisma.agentPauseState.count(),
  };

  console.log("=== DB COUNTS ===");
  for (const [k, v] of Object.entries(counts)) {
    const exp = EXPECTED[k];
    const flag = exp != null ? (v === exp ? "OK" : v === 0 ? "EMPTY" : "MISMATCH") : v === 0 ? "EMPTY" : "OK";
    console.log(`${k}\t${v}\t${exp ?? "-"}\t${flag}`);
  }

  const dupCodes = await prisma.$queryRaw<{ releaseCode: string; cnt: bigint }[]>`
    SELECT "releaseCode", COUNT(*) as cnt FROM "Release" GROUP BY "releaseCode" HAVING COUNT(*) > 1
  `;
  console.log("\n=== DUPLICATE RELEASE CODES ===", dupCodes.length ? dupCodes : "none");

  const releases = await prisma.release.findMany({ select: { id: true, releaseCode: true, status: true }, take: 5 });
  console.log("\n=== SAMPLE DB RELEASES ===", JSON.stringify(releases, null, 2));
}

main().finally(() => prisma.$disconnect());
