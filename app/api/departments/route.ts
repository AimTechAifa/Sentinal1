import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/api";
import { createDepartmentRow } from "@/lib/org-compat";
import { prisma } from "@/lib/prisma";
import { departmentOrderBy, departmentWhere, num, sp } from "@/lib/list-api-filters";

export async function GET(req: Request) {
  const { error } = await requireRole("readonly");
  if (error) return error;

  const params = sp(req);
  const appMin = num(params, "appMin");
  const appMax = num(params, "appMax");

  const data = await prisma.department.findMany({
    where: departmentWhere(params),
    orderBy: departmentOrderBy(params),
    include: { _count: { select: { applications: true } } },
  });

  const filtered =
    appMin === undefined && appMax === undefined
      ? data
      : data.filter((row) => {
          const c = row._count.applications;
          if (appMin !== undefined && c < appMin) return false;
          if (appMax !== undefined && c > appMax) return false;
          return true;
        });

  return NextResponse.json(filtered);
}

export async function POST(req: Request) {
  const { error } = await requireRole("editor");
  if (error) return error;
  const body = await req.json();
  const row = await createDepartmentRow(body.name, body.head ?? "");
  return NextResponse.json(row, { status: 201 });
}
