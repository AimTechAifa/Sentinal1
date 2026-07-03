import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/api";
import { createDepartmentRow } from "@/lib/org-compat";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { error } = await requireRole("readonly");
  if (error) return error;
  const data = await prisma.department.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { applications: true } } },
  });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const { error } = await requireRole("editor");
  if (error) return error;
  const body = await req.json();
  const row = await createDepartmentRow(body.name, body.head ?? "");
  return NextResponse.json(row, { status: 201 });
}
