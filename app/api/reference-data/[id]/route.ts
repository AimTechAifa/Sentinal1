import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/api";
import { prisma } from "@/lib/prisma";

/**
 * Edits a lookup value's text, sort order, or active flag. No DELETE route
 * is exposed on purpose — historical records (e.g. Drift.driftType) may
 * already reference a value, so removal is always active=false (soft
 * deactivate), never a hard delete.
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error } = await requireRole("editor");
  if (error) return error;

  const body = await req.json();

  if (body.value !== undefined && !String(body.value).trim()) {
    return NextResponse.json({ error: "Value cannot be empty" }, { status: 400 });
  }
  const sortOrder = body.sortOrder !== undefined ? Number(body.sortOrder) : undefined;
  if (sortOrder !== undefined && Number.isNaN(sortOrder)) {
    return NextResponse.json({ error: "Sort order must be a number" }, { status: 400 });
  }

  const current = await prisma.referenceData.findUnique({ where: { id } });
  if (!current) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const nextValue = body.value !== undefined ? String(body.value).trim() : undefined;
  if (nextValue !== undefined && nextValue !== current.value) {
    const conflict = await prisma.referenceData.findUnique({
      where: { category_value: { category: current.category, value: nextValue } },
    });
    if (conflict) {
      return NextResponse.json({ error: `"${nextValue}" already exists in category "${current.category}"` }, { status: 409 });
    }
  }

  const row = await prisma.referenceData.update({
    where: { id },
    data: {
      value: nextValue,
      sortOrder,
      active: body.active,
    },
  });
  return NextResponse.json(row);
}
