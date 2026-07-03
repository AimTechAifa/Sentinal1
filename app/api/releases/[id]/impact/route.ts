import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/api";
import { buildDependencyImpact, type ReleaseRowForImpact } from "@/lib/dependency-impact";
import { prisma } from "@/lib/prisma";

const releaseInclude = {
  department: true,
  applications: { include: { application: true } },
  dependsOn: { include: { dependsOnRelease: true } },
  dependedBy: { include: { release: true } },
  bookings: {
    include: {
      application: true,
      environment: true,
      release: { select: { releaseCode: true } },
    },
  },
};

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error } = await requireRole("readonly");
  if (error) return error;

  const [release, allReleases] = await Promise.all([
    prisma.release.findUnique({ where: { id: id }, include: releaseInclude }),
    prisma.release.findMany({ include: releaseInclude }),
  ]);

  if (!release) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const report = buildDependencyImpact(
    release as ReleaseRowForImpact,
    allReleases as ReleaseRowForImpact[]
  );
  return NextResponse.json(report);
}
