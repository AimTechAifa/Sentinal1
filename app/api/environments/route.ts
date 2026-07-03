import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/api";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { error } = await requireRole("readonly");
  if (error) return error;
  const appId = new URL(req.url).searchParams.get("applicationId");
  const data = await prisma.environment.findMany({
    where: appId ? { applicationId: appId } : undefined,
    include: { application: { include: { department: true } } },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const { error } = await requireRole("editor");
  if (error) return error;
  const body = await req.json();
  const row = await prisma.environment.create({
    data: {
      applicationId: body.applicationId,
      name: body.name,
      type: body.type,
      owner: body.owner ?? "",
      lastDbRefresh: body.lastDbRefresh ? new Date(body.lastDbRefresh) : null,
      status: body.status ?? "Available",
    },
    include: { application: true },
  });
  return NextResponse.json(row, { status: 201 });
}
