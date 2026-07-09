import { config } from "dotenv";
config({ override: true });
import { PrismaClient } from "@prisma/client";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(`${name} missing`);
    process.exit(1);
  }
  return value;
}

const url = requireEnv("DIRECT_URL");
const p = new PrismaClient({ datasources: { db: { url } } });

async function main() {
  console.log("using direct", !url.includes("pooler"));
  const started = Date.now();
  const n = await p.$queryRawUnsafe<Array<{ ok: number }>>(`SELECT 1 AS ok`);
  console.log("direct ok", n, `in ${Date.now() - started}ms`);
}

main()
  .catch((e) => {
    console.error("direct fail:", e instanceof Error ? e.message.slice(0, 500) : e);
    process.exit(1);
  })
  .finally(() => p.$disconnect());
