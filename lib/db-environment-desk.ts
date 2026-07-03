import type {
  ApplicationVersionRow,
  EnterpriseDepartment,
  EnvBooking,
  ReleaseImpact,
  ReleaseSize,
  ReleaseTimelineEntry,
} from "./types";
import { hasVersionDrift } from "@/lib/environment-drift";

type AppRow = {
  id: string;
  name: string;
  department: { name: string };
  environments: { id: string; name: string; type: string }[];
};

type VersionRow = {
  applicationId: string;
  environmentId: string;
  version: string;
  environment: { type: string };
  application: { name: string; department: { name: string } };
};

type ReleaseRow = {
  id: string;
  releaseCode: string;
  name: string;
  status: string;
  releaseDate: Date;
  priority: string;
  impact: string;
  owner: string;
  department: { name: string };
};

type BookingRow = {
  id: string;
  applicationId: string;
  bookedBy: string;
  team: string;
  fromDate: Date;
  toDate: Date;
  purpose: string | null;
  releaseId: string | null;
  status: string;
  application: { name: string };
};

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUNE", "JULY", "AUG", "SEP", "OCT", "NOV", "DEC"];

function asDept(name: string): EnterpriseDepartment {
  const allowed: EnterpriseDepartment[] = ["FIN", "HR", "Security", "Platform", "CRM", "Operations"];
  return allowed.includes(name as EnterpriseDepartment) ? (name as EnterpriseDepartment) : "Operations";
}

function toSize(priority: string, impact: string): ReleaseSize {
  if (priority === "High" || impact === "High") return "high";
  if (priority === "Medium" || impact === "Medium") return "medium";
  return "low";
}

function toImpact(impact: string): ReleaseImpact {
  if (impact === "High") return "high";
  if (impact === "Medium") return "medium";
  return "low";
}

function envStage(type: string): "dev" | "test" | "prod" {
  const t = type.toLowerCase();
  if (t.includes("prod")) return "prod";
  if (t.includes("test") || t.includes("uat") || t.includes("stag")) return "test";
  return "dev";
}

export function buildVersionMatrix(apps: AppRow[], versions: VersionRow[], releases: ReleaseRow[] = []): ApplicationVersionRow[] {
  const byApp = new Map<string, VersionRow[]>();
  for (const v of versions) {
    const list = byApp.get(v.applicationId) ?? [];
    list.push(v);
    byApp.set(v.applicationId, list);
  }

  return apps.map((app) => {
    const appVersions = byApp.get(app.id) ?? [];
    const pick = (stage: "dev" | "test" | "prod") => {
      const match = appVersions.find((v) => envStage(v.environment.type) === stage);
      return match?.version ?? "—";
    };
    const dev = pick("dev");
    const test = pick("test");
    const prod = pick("prod");
    const drift = hasVersionDrift(dev, test, prod);
    const promotionPct = prod === dev ? 100 : test === prod ? 66 : dev !== "—" ? 33 : 0;
    const linkedRelease = releases.find((r) =>
      r.department.name === app.department.name || app.name === "SAP"
    );
    return {
      application: app.name,
      dev,
      test,
      prod,
      serviceIds: [],
      drift,
      team: app.department.name,
      promotionPct,
      releaseId: linkedRelease?.id,
    };
  });
}

export function buildTimeline(releases: ReleaseRow[]): ReleaseTimelineEntry[] {
  return releases.map((r) => {
    const start = new Date(r.releaseDate);
    const end = new Date(start);
    end.setDate(end.getDate() + (toSize(r.priority, r.impact) === "high" ? 14 : 7));
    return {
      id: r.id,
      name: `${r.releaseCode} — ${r.name}`,
      department: asDept(r.department.name),
      size: toSize(r.priority, r.impact),
      impact: toImpact(r.impact),
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      status: r.status as ReleaseTimelineEntry["status"],
      releaseId: r.id,
      owner: r.owner,
    };
  });
}

export function buildBookings(bookings: BookingRow[]): EnvBooking[] {
  return bookings.map((b) => {
    const d = new Date(b.fromDate);
    return {
      id: b.id,
      system: b.application.name,
      month: MONTHS[d.getMonth()] ?? "JAN",
      monthIndex: d.getMonth(),
      status: b.status as EnvBooking["status"],
      team: b.team,
      purpose: b.purpose ?? undefined,
      contact: b.bookedBy,
      releaseId: b.releaseId ?? undefined,
    };
  });
}

export function findEnvByStage(app: { environments: { id: string; name: string; type: string }[] }, stage: "dev" | "test" | "prod") {
  return app.environments.find((e) => envStage(e.type) === stage);
}
