import { PrismaClient } from "@prisma/client";

const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
const p = new PrismaClient({ datasources: { db: { url } } });

async function main() {
  const cols = await p.$queryRawUnsafe<Array<{ table_name: string; column_name: string }>>(`
    SELECT table_name, column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND column_name = 'organizationId'
    ORDER BY table_name
  `);
  console.log("tables with organizationId:", cols.map((c) => c.table_name).join(", "));

  const cal = await p.$queryRawUnsafe<Array<{ c: number }>>(
    `SELECT COUNT(*)::int AS c FROM "CalendarEvent"`
  );
  console.log("CalendarEvent count now:", cal[0].c);

  const org = await p.$queryRawUnsafe<Array<{ organizationId: string }>>(
    `SELECT "organizationId" FROM "User" WHERE "organizationId" IS NOT NULL LIMIT 1`
  );
  console.log("orgId:", org[0]?.organizationId);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => p.$disconnect());
