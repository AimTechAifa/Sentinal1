/**
 * Progress-logging wrapper: run sync and print milestones.
 * Prefer: npx tsx scripts/sync-db-from-seed.ts
 */
import { spawn } from "child_process";
import path from "path";

const child = spawn("npx", ["tsx", "scripts/sync-db-from-seed.ts"], {
  cwd: process.cwd(),
  env: { ...process.env, DATABASE_URL: process.env.DIRECT_URL || process.env.DATABASE_URL },
  stdio: ["ignore", "pipe", "pipe"],
  shell: true,
});

let buf = "";
child.stdout.on("data", (d) => {
  const s = d.toString();
  buf += s;
  process.stdout.write(s);
});
child.stderr.on("data", (d) => {
  const s = d.toString();
  buf += s;
  process.stderr.write(s);
});
child.on("close", (code) => {
  console.log("\n--- sync exit", code, "---");
  process.exit(code ?? 1);
});

setTimeout(() => {
  console.error("\n[watchdog] still running after 4 minutes...");
}, 240000);
