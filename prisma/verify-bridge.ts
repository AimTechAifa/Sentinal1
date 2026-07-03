import { prisma } from "../lib/prisma";

async function main() {
  const releases = await prisma.release.findMany({ take: 3, select: { id: true, releaseCode: true, owner: true } });
  const apps = await prisma.application.findMany({ take: 3, select: { id: true, name: true, type: true } });
  const bookings = await prisma.envBooking.findMany({ take: 3, select: { id: true } });

  console.log("releases sample:", releases);
  console.log("applications sample:", apps);
  console.log("bookings count:", await prisma.envBooking.count());
  console.log("OK: core Prisma queries succeeded");
}

main()
  .catch((e) => {
    console.error("FAIL:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
