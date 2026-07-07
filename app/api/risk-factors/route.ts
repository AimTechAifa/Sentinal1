import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/api";
import { prisma } from "@/lib/prisma";
import { riskFactorOrderBy, riskFactorWhere, sp } from "@/lib/list-api-filters";

export async function GET(req: Request) {
  const { error } = await requireRole("readonly");
  if (error) return error;
  const params = sp(req);
  const data = await prisma.riskFactor.findMany({
    where: riskFactorWhere(params),
    orderBy: riskFactorOrderBy(params),
  });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const { error } = await requireRole("editor");
  if (error) return error;
  const body = await req.json();

  if (!body.category?.trim() || !body.factorName?.trim()) {
    return NextResponse.json({ error: "Category and factor name are required" }, { status: 400 });
  }
  const weight = Number(body.weight);
  if (Number.isNaN(weight) || weight <= 0) {
    return NextResponse.json({ error: "Weight must be a positive number" }, { status: 400 });
  }

  const row = await prisma.riskFactor.create({
    data: {
      category: body.category.trim(),
      factorName: body.factorName.trim(),
      weight,
      description: body.description ?? null,
      active: body.active ?? true,
      order: body.order ?? null,
    },
  });
  return NextResponse.json(row, { status: 201 });
}
