import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const orgs = await prisma.$queryRawUnsafe<{ id: string; name: string }[]>(
    `SELECT id, name FROM "Organization" LIMIT 10`
  );
  console.log("orgs", orgs);
  const users = await prisma.$queryRawUnsafe<{ id: string; email: string; organizationId: string }[]>(
    `SELECT id, email, "organizationId" FROM "User" LIMIT 3`
  );
  console.log("users", users);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
