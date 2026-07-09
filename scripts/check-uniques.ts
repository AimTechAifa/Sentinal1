import { PrismaClient } from "@prisma/client";

const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
const p = new PrismaClient({ datasources: { db: { url } } });

async function main() {
  const constraints = await p.$queryRawUnsafe<
    Array<{ table_name: string; constraint_name: string; constraint_type: string }>
  >(`
    SELECT tc.table_name, tc.constraint_name, tc.constraint_type
    FROM information_schema.table_constraints tc
    WHERE tc.table_schema = 'public'
      AND tc.constraint_type IN ('UNIQUE', 'PRIMARY KEY')
      AND tc.table_name IN (
        'Risk','Approval','Drift','EnvBooking','LeaveRecord','Incident',
        'MonitoringAlert','PlannedMaintenance','Release','User','ReferenceData',
        'ReleaseDependency','CalendarEvent'
      )
    ORDER BY tc.table_name, tc.constraint_type, tc.constraint_name
  `);
  console.log(JSON.stringify(constraints, null, 2));

  const book = await p.$queryRawUnsafe(
    `SELECT "bookingCode", "environmentConflictId" FROM "EnvBooking"
     WHERE "bookingCode" IS NOT NULL ORDER BY "bookingCode" LIMIT 3`
  );
  console.log("bookings with code:", book);
  const nulls = await p.$queryRawUnsafe<Array<{ c: number }>>(
    `SELECT COUNT(*)::int AS c FROM "EnvBooking" WHERE "bookingCode" IS NULL`
  );
  console.log("null bookingCode count:", nulls[0].c);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => p.$disconnect());
