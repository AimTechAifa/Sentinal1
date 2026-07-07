import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/api";
import { createDepartmentRow } from "@/lib/org-compat";
import { prisma } from "@/lib/prisma";
import { departmentOrderBy, departmentWhere, sp } from "@/lib/list-api-filters";

export async function GET(req: Request) {
  const { error } = await requireRole("readonly");
  if (error) return error;
  const data = await prisma.department.findMany({
    where: departmentWhere(sp(req)),
    orderBy: departmentOrderBy(sp(req)),
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
