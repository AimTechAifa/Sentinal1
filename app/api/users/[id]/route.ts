import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/api";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error } = await requireRole("editor");
  if (error) return error;

  const body = await req.json();
  const row = await prisma.user.update({
    where: { id },
    data: {
      name: body.name,
      email: body.email,
      role: body.role,
      department: body.department,
      manager: body.manager ?? null,
      accessLevel: body.accessLevel,
      status: body.status,
    },
  });
  return NextResponse.json(row);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error } = await requireRole("editor");
  if (error) return error;

  const [releaseCount, riskCount, approvalCount, stakeholderCount] = await Promise.all([
    prisma.release.count({ where: { releaseOwnerId: id } }),
    prisma.risk.count({ where: { riskOwnerId: id } }),
    prisma.approval.count({ where: { approverId: id } }),
    prisma.releaseStakeholder.count({ where: { userId: id } }),
  ]);

  const total = releaseCount + riskCount + approvalCount + stakeholderCount;
  if (total > 0) {
    const parts: string[] = [];
    if (releaseCount > 0) parts.push(`${releaseCount} release${releaseCount === 1 ? "" : "s"}`);
    if (riskCount > 0) parts.push(`${riskCount} risk${riskCount === 1 ? "" : "s"}`);
    if (approvalCount > 0) parts.push(`${approvalCount} approval${approvalCount === 1 ? "" : "s"}`);
    if (stakeholderCount > 0) parts.push(`${stakeholderCount} stakeholder link${stakeholderCount === 1 ? "" : "s"}`);
    return NextResponse.json(
      { error: `Cannot delete — linked to ${parts.join(", ")}` },
      { status: 409 }
    );
  }

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
