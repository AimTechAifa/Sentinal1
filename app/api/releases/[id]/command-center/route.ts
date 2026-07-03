import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/api";
import {
  calcDbReadiness,
  computeDbLifecycleStages,
  getDbBlockers,
  getDbNextActions,
} from "@/lib/db-release-command";
import { predictDbRelease } from "@/lib/db-predictive";
import { prisma } from "@/lib/prisma";

const releaseInclude = {
  department: true,
  applications: { include: { application: true } },
  dependsOn: { include: { dependsOnRelease: true } },
  bookings: { include: { application: true } },
};

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error } = await requireRole("readonly");
  if (error) return error;

  const release = await prisma.release.findUnique({
    where: { id: id },
    include: releaseInclude,
  });
  if (!release) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const p1Issues = await prisma.p1Issue.findMany({
    where: { releaseCode: release.releaseCode },
    orderBy: { updatedAt: "desc" },
  });

  const blockers = getDbBlockers(release, p1Issues);
  const readiness = calcDbReadiness(release, p1Issues);
  const stages = computeDbLifecycleStages(release, p1Issues);
  const nextActions = getDbNextActions(release, blockers);
  const prediction = predictDbRelease(release, p1Issues);

  return NextResponse.json({
    readiness,
    blockers,
    stages,
    nextActions,
    p1Issues,
    prediction,
  });
}
