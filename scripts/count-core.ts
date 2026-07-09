import { config } from "dotenv";
config({ override: true });
import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();

async function main() {
  for (let i = 0; i < 4; i++) {
    try {
      await p.$queryRawUnsafe("SELECT 1");
      break;
    } catch {
      await new Promise((r) => setTimeout(r, 800 * 2 ** i));
    }
  }
  const [Release, Risk, Drift, Dependencies] = await Promise.all([
    p.release.count(),
    p.risk.count(),
    p.drift.count(),
    p.releaseDependency.count(),
  ]);
  console.log(JSON.stringify({ Release, Risk, Drift, Dependencies }, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => p.$disconnect());
