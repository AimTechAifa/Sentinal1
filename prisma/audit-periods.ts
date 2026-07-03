import { periodRange } from "../lib/period-range";
import { prisma } from "../lib/prisma";

async function main() {
  for (const period of ["month", "quarter", "year"] as const) {
    const { start, end } = periodRange(period, new Date("2026-06-27"));
    const n = await prisma.release.count({ where: { releaseDate: { gte: start, lte: end } } });
    console.log(`${period}: ${n} releases (${start.toISOString().slice(0, 10)} → ${end.toISOString().slice(0, 10)})`);
  }
  const calByMonth = await prisma.$queryRaw<{ m: string; c: bigint }[]>`
    SELECT to_char(date, 'YYYY-MM') as m, COUNT(*)::int as c FROM "CalendarEvent" GROUP BY 1 ORDER BY 1 LIMIT 12
  `;
  console.log("Calendar by month:", calByMonth);
}

main().finally(() => prisma.$disconnect());
