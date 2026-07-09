import { config } from "dotenv";
config({ override: true });
import { PrismaClient } from "@prisma/client";

const url = process.env.DATABASE_URL;
const p = new PrismaClient({ datasources: { db: { url } } });

async function main() {
  console.log("using", url?.includes("pooler") ? "pooler" : "direct");
  console.log("connect_timeout", url?.match(/connect_timeout=(\d+)/)?.[1] ?? "default");
  const started = Date.now();
  const n = await p.$queryRawUnsafe<Array<{ ok: number }>>(`SELECT 1 AS ok`);
  console.log("db ok", n, `in ${Date.now() - started}ms`);
}

main()
  .catch((e) => {
    console.error("db fail:", e instanceof Error ? e.message.slice(0, 500) : e);
    process.exit(1);
  })
  .finally(() => p.$disconnect());
