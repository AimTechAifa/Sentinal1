import { prisma } from "../lib/prisma";
import { periodRange } from "../lib/period-range";

async function main() {
  const { start, end } = periodRange("month", new Date("2026-06-27"));
  const statuses = await prisma.release.groupBy({ by: ["status"], _count: true });
  const inMonth = await prisma.release.count({ where: { releaseDate: { gte: start, lte: end } } });
  const dateRange = await prisma.release.aggregate({ _min: { releaseDate: true }, _max: { releaseDate: true } });
  const conflictReleases = await prisma.release.count({ where: { conflictFlag: true } });
  const conflictBookings = await prisma.envBooking.count({ where: { conflictFlag: true } });
  const calJune = await prisma.calendarEvent.count({
    where: { date: { gte: new Date("2026-06-01"), lte: new Date("2026-06-30") } },
  });

  console.log("Month window:", start.toISOString().slice(0, 10), "→", end.toISOString().slice(0, 10));
  console.log("Releases in month filter:", inMonth, "/ 80 total");
  console.log("Release dates:", dateRange._min.releaseDate?.toISOString().slice(0, 10), "→", dateRange._max.releaseDate?.toISOString().slice(0, 10));
  console.log("Status values in DB:", statuses);
  console.log("Conflict releases:", conflictReleases, "bookings:", conflictBookings);
  console.log("Calendar events June 2026:", calJune);
}

main().finally(() => prisma.$disconnect());
