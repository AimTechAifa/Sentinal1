import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/api";
import { createApplicationRow } from "@/lib/org-compat";
import { prisma } from "@/lib/prisma";
import { applicationOrderBy, applicationWhere, num, sp } from "@/lib/list-api-filters";

export async function GET(req: Request) {
  const { error } = await requireRole("readonly");
  if (error) return error;

  const params = sp(req);
  const envMin = num(params, "envMin");
  const envMax = num(params, "envMax");

  const data = await prisma.application.findMany({
    where: applicationWhere(params),
    include: {
      department: true,
      _count: { select: { environments: true, releaseLinks: true, bookings: true } },
    },
    orderBy: applicationOrderBy(params),
  });

  // Exact env-count range (server-side) — Prisma where only supports none/some for relations.
  const filtered =
    envMin === undefined && envMax === undefined
      ? data
      : data.filter((row) => {
          const c = row._count.environments;
          if (envMin !== undefined && c < envMin) return false;
          if (envMax !== undefined && c > envMax) return false;
          return true;
        });

  return NextResponse.json(filtered);
}

export async function POST(req: Request) {
  const { error } = await requireRole("editor");
  if (error) return error;
  const body = await req.json();
  const row = await createApplicationRow({
    name: body.name,
    departmentId: body.departmentId,
    type: body.type ?? "",
    productOwner: body.productOwner ?? "",
    techLead: body.techLead ?? "",
    support: body.support ?? "",
    criticality: body.criticality ?? "Medium",
  });
  return NextResponse.json(row, { status: 201 });
}
