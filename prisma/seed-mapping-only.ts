import { prisma } from "../lib/prisma";
import { seedSystemMapping } from "../lib/seed-system-mapping";

seedSystemMapping(prisma)
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
