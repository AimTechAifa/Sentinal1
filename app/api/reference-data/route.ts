import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/api";
import { prisma } from "@/lib/prisma";
import { referenceDataWhere, sp } from "@/lib/list-api-filters";

/**
 * Generic reference-data lookup endpoint. Supports ?category=drift_type to
 * scope to a single fixed-value dropdown; omitting it returns all rows
 * across all categories. Only active rows are returned by default — pass
 * ?includeInactive=1 to get everything (e.g. for a future admin browse page).
 */
export async function GET(req: Request) {
  const { error } = await requireRole("readonly");
  if (error) return error;

  const params = sp(req);

  const data = await prisma.referenceData.findMany({
    where: referenceDataWhere(params),
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { value: "asc" }],
  });
  return NextResponse.json(data);
}

/**
 * Creates a new lookup value. If `category` doesn't exist yet, this
 * implicitly creates it — categories are not a separate table, they're
 * just the distinct set of category strings already in this table. This
 * is what powers "+ New Category" in the admin management screen.
 */
export async function POST(req: Request) {
  const { error } = await requireRole("editor");
  if (error) return error;

  const body = await req.json();
  const category = String(body.category ?? "").trim();
  const value = String(body.value ?? "").trim();

  if (!category || !value) {
    return NextResponse.json({ error: "Category and value are required" }, { status: 400 });
  }

  const existing = await prisma.referenceData.findUnique({
    where: { category_value: { category, value } },
  });
  if (existing) {
    return NextResponse.json({ error: `"${value}" already exists in category "${category}"` }, { status: 409 });
  }

  const row = await prisma.referenceData.create({
    data: {
      category,
      value,
      sortOrder: Number.isFinite(Number(body.sortOrder)) ? Number(body.sortOrder) : 0,
      active: body.active ?? true,
    },
  });
  return NextResponse.json(row, { status: 201 });
}
