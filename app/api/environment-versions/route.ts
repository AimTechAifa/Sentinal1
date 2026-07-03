import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/api";
import { buildVersionMatrix, findEnvByStage } from "@/lib/db-environment-desk";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { error } = await requireRole("readonly");
  if (error) return error;

  const [apps, versions] = await Promise.all([
    prisma.application.findMany({ include: { department: true, environments: true } }),
    prisma.environmentVersion.findMany({ include: { environment: true, application: { include: { department: true } } } }),
  ]);

  return NextResponse.json({ matrix: buildVersionMatrix(apps, versions), apps });
}

export async function POST(req: Request) {
  const { user, error } = await requireRole("editor");
  if (error) return error;

  const { applicationName, fromStage, toStage } = (await req.json()) as {
    applicationName: string;
    fromStage: "dev" | "test" | "prod";
    toStage: "dev" | "test" | "prod";
  };

  const app = await prisma.application.findFirst({
    where: { name: applicationName },
    include: { environments: true, department: true },
  });
  if (!app) return NextResponse.json({ error: "Application not found" }, { status: 404 });

  const sourceEnv = findEnvByStage(app, fromStage);
  const targetEnv = findEnvByStage(app, toStage);
  if (!sourceEnv || !targetEnv) {
    return NextResponse.json({ error: "Environment stage not found" }, { status: 400 });
  }

  const sourceVersion = await prisma.environmentVersion.findUnique({
    where: { applicationId_environmentId: { applicationId: app.id, environmentId: sourceEnv.id } },
  });
  if (!sourceVersion) {
    return NextResponse.json({ error: "No version on source environment" }, { status: 400 });
  }

  const row = await prisma.environmentVersion.upsert({
    where: { applicationId_environmentId: { applicationId: app.id, environmentId: targetEnv.id } },
    create: {
      applicationId: app.id,
      environmentId: targetEnv.id,
      version: sourceVersion.version,
      updatedBy: user!.name,
    },
    update: { version: sourceVersion.version, updatedBy: user!.name },
  });

  return NextResponse.json(row);
}
