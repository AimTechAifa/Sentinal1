import { prisma } from "./prisma";

let cachedOrgId: string | null | undefined;

/** v2 Neon DB has Organization FK columns not in v1 Prisma schema */
export async function getDefaultOrganizationId(): Promise<string | null> {
  if (cachedOrgId !== undefined) return cachedOrgId;
  try {
    const rows = await prisma.$queryRaw<{ id: string }[]>`SELECT id FROM "Organization" LIMIT 1`;
    cachedOrgId = rows[0]?.id ?? null;
  } catch {
    cachedOrgId = null;
  }
  return cachedOrgId;
}

function newId(): string {
  const t = Date.now().toString(36);
  const r = Math.random().toString(36).slice(2, 10);
  return `c${t}${r}`.slice(0, 25);
}

export async function createDepartmentRow(name: string, head: string) {
  const orgId = await getDefaultOrganizationId();
  if (!orgId) {
    return prisma.department.create({ data: { name, head } });
  }
  const id = newId();
  const now = new Date();
  const rows = await prisma.$queryRaw<
    { id: string; name: string; head: string; createdAt: Date; updatedAt: Date }[]
  >`
    INSERT INTO "Department" (id, name, head, "organizationId", "createdAt", "updatedAt")
    VALUES (${id}, ${name}, ${head}, ${orgId}, ${now}, ${now})
    RETURNING id, name, head, "createdAt", "updatedAt"
  `;
  return rows[0];
}

export async function createApplicationRow(data: {
  name: string;
  departmentId: string;
  type: string;
  productOwner: string;
  techLead: string;
  support: string;
  criticality: string;
}) {
  const orgId = await getDefaultOrganizationId();
  if (!orgId) {
    return prisma.application.create({
      data,
      include: { department: true, _count: { select: { environments: true, releaseLinks: true, bookings: true } } },
    });
  }
  const id = newId();
  const now = new Date();
  await prisma.$executeRaw`
    INSERT INTO "Application" (id, name, "departmentId", type, "productOwner", "techLead", support, criticality, "organizationId", "createdAt", "updatedAt")
    VALUES (${id}, ${data.name}, ${data.departmentId}, ${data.type}, ${data.productOwner}, ${data.techLead}, ${data.support}, ${data.criticality}, ${orgId}, ${now}, ${now})
  `;
  return prisma.application.findUniqueOrThrow({
    where: { id },
    include: { department: true, _count: { select: { environments: true, releaseLinks: true, bookings: true } } },
  });
}

export async function createUserRow(data: {
  userId: string;
  name: string;
  email: string;
  role: string;
  department: string;
  manager: string | null;
  accessLevel: string;
  status: string;
}) {
  const orgId = await getDefaultOrganizationId();
  if (!orgId) {
    return prisma.user.create({ data });
  }
  const id = newId();
  const now = new Date();
  const rows = await prisma.$queryRaw<
    {
      id: string;
      userId: string;
      name: string;
      email: string;
      role: string;
      department: string;
      manager: string | null;
      accessLevel: string;
      status: string;
      lastLogin: Date | null;
      createdAt: Date;
      updatedAt: Date;
    }[]
  >`
    INSERT INTO "User" (id, "userId", name, email, role, department, manager, "accessLevel", status, "organizationId", "createdAt", "updatedAt")
    VALUES (${id}, ${data.userId}, ${data.name}, ${data.email}, ${data.role}, ${data.department}, ${data.manager}, ${data.accessLevel}, ${data.status}, ${orgId}, ${now}, ${now})
    RETURNING id, "userId", name, email, role, department, manager, "accessLevel", status, "lastLogin", "createdAt", "updatedAt"
  `;
  return rows[0];
}
