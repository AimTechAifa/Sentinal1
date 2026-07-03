import fs from "fs";
import path from "path";
import { prisma } from "../lib/prisma";

const TABLES = [
  "Department",
  "Application",
  "Environment",
  "Release",
  "User",
  "EnvBooking",
  "Risk",
  "Approval",
] as const;

async function main() {
  const counts: Record<string, number> = {};
  for (const table of TABLES) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const n = await (prisma as any)[table.charAt(0).toLowerCase() + table.slice(1)].count();
    counts[table] = n;
  }
  const out = path.join(process.cwd(), "prisma", "backup-pre-v1-bridge.json");
  fs.writeFileSync(out, JSON.stringify({ capturedAt: new Date().toISOString(), counts }, null, 2));
  console.log("Backup row counts saved to", out);
  console.log(counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
