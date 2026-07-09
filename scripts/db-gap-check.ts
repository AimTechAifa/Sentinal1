import { PrismaClient } from "@prisma/client";

const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
const p = new PrismaClient({ datasources: { db: { url } } });

async function main() {
  const users = await p.$queryRawUnsafe<Array<{ email: string; userId: string }>>(
    `SELECT email, "userId" FROM "User" ORDER BY email`
  );
  console.log("User count", users.length);

  const seed = require("../prisma/seed-data/users.json");
  const dbEmails = new Set(users.map((u) => u.email.toLowerCase()));
  const missing = seed.filter((u: { Email: string }) => !dbEmails.has(String(u.Email).toLowerCase()));
  console.log("Missing users:", missing.map((u: { Email: string; "User ID": string }) => u.Email + " / " + u["User ID"]));

  const books = await p.$queryRawUnsafe(
    `SELECT "bookingCode", "environmentConflictId" FROM "EnvBooking" ORDER BY "bookingCode" NULLS LAST LIMIT 5`
  );
  console.log("bookings sample:", books);

  const nullCodes = await p.$queryRawUnsafe<Array<{ c: bigint }>>(
    `SELECT COUNT(*)::bigint AS c FROM "EnvBooking" WHERE "bookingCode" IS NULL`
  );
  console.log("bookings with null code:", Number(nullCodes[0].c));

  const calApp = await p.$queryRawUnsafe<Array<{ c: bigint }>>(
    `SELECT COUNT(*)::bigint AS c FROM "CalendarEvent" WHERE "applicationName" IS NOT NULL`
  );
  console.log("calendar with applicationName:", Number(calApp[0].c));

  const riskApp = await p.$queryRawUnsafe(
    `SELECT "riskCode", "applicationName", "departmentName" FROM "Risk" WHERE "riskCode"='RSK-0001' LIMIT 1`
  );
  console.log("RSK-0001:", riskApp);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => p.$disconnect());
