import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/api";
import { createUserRow } from "@/lib/org-compat";
import { prisma } from "@/lib/prisma";

async function nextUserId() {
  const count = await prisma.user.count();
  return `USR-${String(count + 1).padStart(4, "0")}`;
}

export async function GET() {
  const { error } = await requireRole("readonly");
  if (error) return error;

  const data = await prisma.user.findMany({
    orderBy: [{ department: "asc" }, { name: "asc" }],
  });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const { error } = await requireRole("editor");
  if (error) return error;

  const body = await req.json();
  const userId = body.userId?.trim() || (await nextUserId());

  const row = await createUserRow({
    userId,
    name: body.name,
    email: body.email,
    role: body.role ?? "Developer",
    department: body.department ?? "",
    manager: body.manager ?? null,
    accessLevel: body.accessLevel ?? "Standard",
    status: body.status ?? "Active",
  });
  return NextResponse.json(row, { status: 201 });
}
