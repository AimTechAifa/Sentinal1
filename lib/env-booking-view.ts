import fs from "fs";
import path from "path";

type SeedRow = Record<string, unknown>;

export type EnvBookingViewRow = {
  id: string;
  bookingCode: string;
  application: { id: string; name: string; department?: { name: string } };
  release: { releaseCode: string } | null;
  departmentName: string;
  dependencies: string;
  releaseSize: string | null;
  prodReleaseDate: string | null;
  cabDate: string | null;
  testEnvCode: string | null;
  testStart: string | null;
  testEnd: string | null;
  testDays: number | null;
  uatEnvCode: string | null;
  uatStart: string | null;
  uatEnd: string | null;
  uatDays: number | null;
  preProdEnvCode: string | null;
  preProdStart: string | null;
  preProdEnd: string | null;
  preProdDays: number | null;
  conflictFlag: boolean;
  purpose: string | null;
};

const toIso = (v: unknown): string | null => (v ? new Date(String(v)).toISOString() : null);
const toInt = (v: unknown): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n) : null;
};
const isConflict = (v: unknown) => typeof v === "string" && v.includes("CONFLICT");

let cached: SeedRow[] | null = null;

export function loadSeedEnvBookings(): SeedRow[] {
  if (cached) return cached;
  const file = path.join(process.cwd(), "prisma/seed-data/env_booking.json");
  cached = JSON.parse(fs.readFileSync(file, "utf-8")).filter((b: SeedRow) =>
    String(b["Booking ID"] ?? "").startsWith("ENV-")
  );
  return cached!;
}

export function mapSeedEnvBookingRow(b: SeedRow): EnvBookingViewRow {
  const bookingCode = String(b["Booking ID"]);
  const department = String(b["Department"] ?? "");
  return {
    id: bookingCode,
    bookingCode,
    application: {
      id: bookingCode,
      name: String(b["Application"] ?? ""),
      department: { name: department },
    },
    release: b["Release ID"] ? { releaseCode: String(b["Release ID"]) } : null,
    departmentName: department,
    dependencies: b["Dependencies"] ? String(b["Dependencies"]) : "NA",
    releaseSize: b["Release Size"] ? String(b["Release Size"]) : null,
    prodReleaseDate: toIso(b["Prod Release Date"]),
    cabDate: toIso(b["CAB Date"]),
    testEnvCode: b["Test Env"] ? String(b["Test Env"]) : null,
    testStart: toIso(b["Test Start"]),
    testEnd: toIso(b["Test End"]),
    testDays: toInt(b["Test Days"]),
    uatEnvCode: b["UAT Env"] ? String(b["UAT Env"]) : null,
    uatStart: toIso(b["UAT Start"]),
    uatEnd: toIso(b["UAT End"]),
    uatDays: toInt(b["UAT Days"]),
    preProdEnvCode: b["Pre-Prod Env"] ? String(b["Pre-Prod Env"]) : null,
    preProdStart: toIso(b["Pre-Prod Start"]),
    preProdEnd: toIso(b["Pre-Prod End"]),
    preProdDays: toInt(b["Pre-Prod Days"]),
    conflictFlag: isConflict(b["Conflict Flag"]),
    purpose: b["Notes"] ? String(b["Notes"]) : null,
  };
}

export function filterSeedEnvBookings(
  rows: EnvBookingViewRow[],
  filters: {
    departmentName?: string;
    applicationName?: string;
    releaseId?: string;
    conflictFlag?: boolean;
  }
): EnvBookingViewRow[] {
  return rows.filter((row) => {
    if (filters.departmentName && row.departmentName !== filters.departmentName) return false;
    if (filters.applicationName && row.application.name !== filters.applicationName) return false;
    if (filters.releaseId && row.release?.releaseCode !== filters.releaseId) return false;
    if (filters.conflictFlag !== undefined && row.conflictFlag !== filters.conflictFlag) return false;
    return true;
  });
}
