import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/api";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { error } = await requireRole("readonly");
  if (error) return error;
  const data = await prisma.riskFactor.findMany({
    orderBy: [{ order: "asc" }, { category: "asc" }, { factorName: "asc" }],
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
