import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/api";
import { prisma } from "@/lib/prisma";

const edgeInclude = {
  sourceApp: { include: { department: true } },
  sourceEnv: true,
  targetApp: { include: { department: true } },
  targetEnv: true,
} as const;

export async function GET() {
  const { error } = await requireRole("readonly");
  if (error) return error;

  const groups = await prisma.systemMappingGroup.findMany({
    where: { status: "accepted" },
    orderBy: { updatedAt: "desc" },
    include: {
      edges: { include: edgeInclude },
    },
  });

  const orphanEdges = await prisma.systemMappingEdge.findMany({
    where: { groupId: null },
    include: edgeInclude,
  });

  const legacyGroup =
    orphanEdges.length > 0
      ? [
          {
            id: "legacy-default",
            name: "Default enterprise setup",
            status: "accepted",
            sourceNotes: null,
            createdAt: orphanEdges[0].createdAt.toISOString(),
            updatedAt: orphanEdges[orphanEdges.length - 1].updatedAt.toISOString(),
            edges: orphanEdges.map((e) => ({
              ...e,
              createdAt: e.createdAt.toISOString(),
              updatedAt: e.updatedAt.toISOString(),
            })),
          },
        ]
      : [];

  return NextResponse.json({
    groups: [
      ...groups.map((g) => ({
        ...g,
        createdAt: g.createdAt.toISOString(),
        updatedAt: g.updatedAt.toISOString(),
        edges: g.edges.map((e) => ({
          ...e,
          createdAt: e.createdAt.toISOString(),
          updatedAt: e.updatedAt.toISOString(),
        })),
      })),
      ...legacyGroup,
    ],
  });
}

export async function POST(req: Request) {
  const { error } = await requireRole("editor");
  if (error) return error;

  const body = (await req.json()) as {
    name?: string;
    sourceNotes?: string;
    edges?: {
      sourceAppId: string;
      sourceEnvId: string;
      targetAppId: string;
      targetEnvId: string;
      direction?: string;
      notes?: string;
    }[];
  };

  if (!body.name?.trim()) {
    return NextResponse.json({ error: "name required" }, { status: 400 });
  }
  if (!body.edges?.length) {
    return NextResponse.json({ error: "at least one edge required" }, { status: 400 });
  }

  const group = await prisma.systemMappingGroup.create({
    data: {
      name: body.name.trim(),
      status: "accepted",
      sourceNotes: body.sourceNotes?.trim() || null,
      edges: {
        create: body.edges.map((e) => ({
          sourceAppId: e.sourceAppId,
          sourceEnvId: e.sourceEnvId,
          targetAppId: e.targetAppId,
          targetEnvId: e.targetEnvId,
          direction: e.direction ?? "downstream",
          notes: e.notes ?? null,
          isDefault: false,
        })),
      },
    },
    include: {
      edges: { include: edgeInclude },
    },
  });

  return NextResponse.json(
    {
      ...group,
      createdAt: group.createdAt.toISOString(),
      updatedAt: group.updatedAt.toISOString(),
      edges: group.edges.map((e) => ({
        ...e,
        createdAt: e.createdAt.toISOString(),
        updatedAt: e.updatedAt.toISOString(),
      })),
    },
    { status: 201 }
  );
}
