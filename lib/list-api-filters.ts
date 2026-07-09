import type { Prisma } from "@prisma/client";
import {
  filtersFromSearchParams,
  type ReleaseListFilters,
} from "./release-filters";

export function sp(req: Request): URLSearchParams {
  return new URL(req.url).searchParams;
}

export function str(sp: URLSearchParams, key: string): string | undefined {
  const v = sp.get(key)?.trim();
  return v || undefined;
}

export function bool(sp: URLSearchParams, key: string): boolean | undefined {
  const v = sp.get(key);
  if (v === "1" || v === "true") return true;
  if (v === "0" || v === "false") return false;
  return undefined;
}

export function intParam(sp: URLSearchParams, key: string, fallback: number): number {
  const v = parseInt(sp.get(key) ?? "", 10);
  return Number.isFinite(v) && v > 0 ? v : fallback;
}

// --- Release list (extends dept/app/env) ---

export function releaseListWhere(sp: URLSearchParams): Prisma.ReleaseWhereInput {
  const filters = filtersFromSearchParams(sp);
  const parts: Prisma.ReleaseWhereInput[] = [];

  if (filters.departmentId) parts.push({ departmentId: filters.departmentId });
  if (filters.applicationId) {
    parts.push({ applications: { some: { applicationId: filters.applicationId } } });
  }
  if (filters.environmentId) {
    parts.push({
      OR: [
        { bookings: { some: { environmentId: filters.environmentId } } },
        {
          applications: {
            some: { application: { environments: { some: { id: filters.environmentId } } } },
          },
        },
      ],
    });
  }
  if (filters.status) parts.push({ status: filters.status });
  if (filters.priority) parts.push({ priority: filters.priority });
  if (filters.impact) parts.push({ impact: filters.impact });

  if (!parts.length) return {};
  if (parts.length === 1) return parts[0];
  return { AND: parts };
}

export function releaseListOrderBy(sp: URLSearchParams): Prisma.ReleaseOrderByWithRelationInput {
  const sort = str(sp, "sort") ?? "releaseDate";
  const dir = str(sp, "sortDir") === "desc" ? "desc" : "asc";
  switch (sort) {
    case "releaseId":
    case "releaseCode":
      return { releaseCode: dir };
    case "date":
    case "releaseDate":
      return { releaseDate: dir };
    case "status":
      return { status: dir };
    case "priority":
      return { priority: dir };
    default:
      return { releaseDate: dir };
  }
}

// --- Bookings ---

export function bookingWhere(sp: URLSearchParams): Prisma.EnvBookingWhereInput {
  const parts: Prisma.EnvBookingWhereInput[] = [];
  const dept = str(sp, "dept");
  const app = str(sp, "app");
  const env = str(sp, "env");
  const release = str(sp, "release");
  const conflict = bool(sp, "conflict");

  if (dept) parts.push({ application: { departmentId: dept } });
  if (app) parts.push({ applicationId: app });
  if (env) parts.push({ environmentId: env });
  if (release) parts.push({ releaseId: release });
  if (conflict !== undefined) parts.push({ conflictFlag: conflict });

  if (!parts.length) return {};
  if (parts.length === 1) return parts[0];
  return { AND: parts };
}

// --- Dependencies ---

export function dependencyWhere(sp: URLSearchParams): Prisma.ReleaseDependencyWhereInput {
  const parts: Prisma.ReleaseDependencyWhereInput[] = [];
  const status = str(sp, "status");
  const type = str(sp, "type");
  if (status) parts.push({ status });
  if (type) parts.push({ dependencyType: type });
  if (!parts.length) return {};
  if (parts.length === 1) return parts[0];
  return { AND: parts };
}

// --- Conflicts ---

export function conflictReleaseWhere(sp: URLSearchParams): Prisma.ReleaseWhereInput {
  const parts: Prisma.ReleaseWhereInput[] = [{ conflictFlag: true }];
  const dept = str(sp, "dept");
  const app = str(sp, "app");
  if (dept) parts.push({ departmentId: dept });
  if (app) parts.push({ applications: { some: { applicationId: app } } });
  return { AND: parts };
}

export function conflictBookingWhere(sp: URLSearchParams): Prisma.EnvBookingWhereInput {
  const parts: Prisma.EnvBookingWhereInput[] = [{ conflictFlag: true }];
  const dept = str(sp, "dept");
  const app = str(sp, "app");
  if (dept) parts.push({ application: { departmentId: dept } });
  if (app) parts.push({ applicationId: app });
  return { AND: parts };
}

// --- Approvals ---

export function approvalWhere(sp: URLSearchParams): Prisma.ApprovalWhereInput {
  const parts: Prisma.ApprovalWhereInput[] = [];
  const decision = str(sp, "decision");
  const type = str(sp, "type");
  const approver = str(sp, "approver");
  const release = str(sp, "release");
  if (decision) parts.push({ decision });
  if (type) parts.push({ approvalType: type });
  if (approver) parts.push({ approverId: approver });
  if (release) parts.push({ releaseId: release });
  if (!parts.length) return {};
  if (parts.length === 1) return parts[0];
  return { AND: parts };
}

// --- Leaves ---

export function leaveWhere(sp: URLSearchParams): Prisma.LeaveRecordWhereInput {
  const parts: Prisma.LeaveRecordWhereInput[] = [];
  const type = str(sp, "type");
  const dept = str(sp, "dept");
  const risk = str(sp, "risk");
  if (type) parts.push({ leaveType: type });
  if (dept) parts.push({ user: { department: { contains: dept, mode: "insensitive" } } });
  if (risk === "low") parts.push({ riskScore: { lte: 3 } });
  if (risk === "medium") parts.push({ riskScore: { gt: 3, lte: 6 } });
  if (risk === "high") parts.push({ riskScore: { gt: 6 } });
  if (!parts.length) return {};
  if (parts.length === 1) return parts[0];
  return { AND: parts };
}

// --- Incidents ---

export function incidentWhere(sp: URLSearchParams): Prisma.IncidentWhereInput {
  const parts: Prisma.IncidentWhereInput[] = [];
  const severity = str(sp, "severity");
  const status = str(sp, "status");
  const app = str(sp, "app");
  const dept = str(sp, "dept");
  const env = str(sp, "env");
  if (severity) parts.push({ severity });
  if (status) parts.push({ status });
  if (app) parts.push({ applicationId: app });
  if (dept) parts.push({ departmentName: dept });
  if (env) parts.push({ environmentName: env });
  if (!parts.length) return {};
  if (parts.length === 1) return parts[0];
  return { AND: parts };
}

// --- Monitoring alerts ---

export function monitoringAlertWhere(sp: URLSearchParams): Prisma.MonitoringAlertWhereInput {
  const parts: Prisma.MonitoringAlertWhereInput[] = [];
  const severity = str(sp, "severity");
  const status = str(sp, "status");
  const app = str(sp, "app");
  const dept = str(sp, "dept");
  const env = str(sp, "env");
  const alertType = str(sp, "alertType");
  if (severity) parts.push({ severity });
  if (status) parts.push({ status });
  if (app) parts.push({ applicationId: app });
  if (dept) parts.push({ departmentName: dept });
  if (env) parts.push({ environmentName: env });
  if (alertType) parts.push({ alertType });
  if (!parts.length) return {};
  if (parts.length === 1) return parts[0];
  return { AND: parts };
}

// --- Application status ---

export function applicationStatusWhere(sp: URLSearchParams): Prisma.ApplicationStatusWhereInput {
  const parts: Prisma.ApplicationStatusWhereInput[] = [];
  const status = str(sp, "status");
  const env = str(sp, "env");
  const app = str(sp, "app");
  const dept = str(sp, "dept");
  if (status) parts.push({ status });
  if (env) parts.push({ environmentName: env });
  if (app) parts.push({ applicationId: app });
  if (dept) parts.push({ application: { department: { name: dept } } });
  if (!parts.length) return {};
  if (parts.length === 1) return parts[0];
  return { AND: parts };
}

// --- Planned maintenance ---

export function plannedMaintenanceWhere(sp: URLSearchParams): Prisma.PlannedMaintenanceWhereInput {
  const parts: Prisma.PlannedMaintenanceWhereInput[] = [];
  const type = str(sp, "type");
  const approvalStatus = str(sp, "approvalStatus");
  const app = str(sp, "app");
  const dept = str(sp, "dept");
  const env = str(sp, "env");
  const impact = str(sp, "impact");
  if (type) parts.push({ type });
  if (approvalStatus) parts.push({ approvalStatus });
  if (app) parts.push({ applicationId: app });
  if (dept) parts.push({ departmentName: dept });
  if (env) parts.push({ environmentName: env });
  if (impact) parts.push({ impact });
  if (!parts.length) return {};
  if (parts.length === 1) return parts[0];
  return { AND: parts };
}

// --- Risks ---

export function riskWhere(sp: URLSearchParams): Prisma.RiskWhereInput {
  const parts: Prisma.RiskWhereInput[] = [];
  const status = str(sp, "status");
  const category = str(sp, "category");
  const owner = str(sp, "owner");
  const release = str(sp, "release");
  const likelihoodRaw = str(sp, "likelihood");
  const impactRaw = str(sp, "impact");
  if (status) parts.push({ status });
  if (category) parts.push({ category });
  if (owner) parts.push({ riskOwnerId: owner });
  if (release) parts.push({ releaseId: release });
  if (likelihoodRaw) {
    const likelihood = parseInt(likelihoodRaw, 10);
    if (Number.isFinite(likelihood) && likelihood >= 1 && likelihood <= 5) {
      parts.push({ likelihood });
    }
  }
  if (impactRaw) {
    const impact = parseInt(impactRaw, 10);
    if (Number.isFinite(impact) && impact >= 1 && impact <= 5) {
      parts.push({ impact });
    }
  }
  if (!parts.length) return {};
  if (parts.length === 1) return parts[0];
  return { AND: parts };
}

// --- Drifts ---

export function driftWhere(sp: URLSearchParams): Prisma.DriftWhereInput {
  const parts: Prisma.DriftWhereInput[] = [];
  const driftType = str(sp, "driftType");
  const severity = str(sp, "severity");
  const status = str(sp, "status");
  const app = str(sp, "app");
  const release = str(sp, "release");
  if (driftType) parts.push({ driftType });
  if (severity) parts.push({ severity });
  if (status) parts.push({ status });
  if (app) parts.push({ applicationId: app });
  if (release) parts.push({ releaseId: release });
  if (!parts.length) return {};
  if (parts.length === 1) return parts[0];
  return { AND: parts };
}

// --- Master data: departments ---

export function departmentWhere(sp: URLSearchParams): Prisma.DepartmentWhereInput {
  const q = str(sp, "q");
  if (!q) return {};
  return {
    OR: [
      { name: { contains: q, mode: "insensitive" } },
      { head: { contains: q, mode: "insensitive" } },
    ],
  };
}

export function departmentOrderBy(sp: URLSearchParams): Prisma.DepartmentOrderByWithRelationInput {
  const sort = str(sp, "sort") ?? "name";
  const dir = str(sp, "sortDir") === "desc" ? "desc" : "asc";
  if (sort === "head") return { head: dir };
  return { name: dir };
}

// --- Master data: applications ---

export function applicationWhere(sp: URLSearchParams): Prisma.ApplicationWhereInput {
  const parts: Prisma.ApplicationWhereInput[] = [];
  const q = str(sp, "q");
  const dept = str(sp, "dept");
  const criticality = str(sp, "criticality");
  const type = str(sp, "type");
  if (dept) parts.push({ departmentId: dept });
  if (criticality) parts.push({ criticality });
  if (type) parts.push({ type });
  if (q) {
    parts.push({
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { type: { contains: q, mode: "insensitive" } },
        { productOwner: { contains: q, mode: "insensitive" } },
        { techLead: { contains: q, mode: "insensitive" } },
        { department: { name: { contains: q, mode: "insensitive" } } },
      ],
    });
  }
  if (!parts.length) return {};
  if (parts.length === 1) return parts[0];
  return { AND: parts };
}

export function applicationOrderBy(sp: URLSearchParams): Prisma.ApplicationOrderByWithRelationInput {
  const sort = str(sp, "sort") ?? "name";
  const dir = str(sp, "sortDir") === "desc" ? "desc" : "asc";
  if (sort === "criticality") return { criticality: dir };
  if (sort === "type") return { type: dir };
  return { name: dir };
}

// --- Master data: users ---

export function userWhere(sp: URLSearchParams): Prisma.UserWhereInput {
  const parts: Prisma.UserWhereInput[] = [];
  const q = str(sp, "q");
  const dept = str(sp, "dept");
  const role = str(sp, "role");
  const access = str(sp, "access");
  const status = str(sp, "status");
  if (dept) parts.push({ department: { contains: dept, mode: "insensitive" } });
  if (role) parts.push({ role });
  if (access) parts.push({ accessLevel: access });
  if (status) parts.push({ status });
  if (q) {
    parts.push({
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { role: { contains: q, mode: "insensitive" } },
        { department: { contains: q, mode: "insensitive" } },
        { accessLevel: { contains: q, mode: "insensitive" } },
        { status: { contains: q, mode: "insensitive" } },
      ],
    });
  }
  if (!parts.length) return {};
  if (parts.length === 1) return parts[0];
  return { AND: parts };
}

export function userOrderBy(sp: URLSearchParams): Prisma.UserOrderByWithRelationInput {
  const sort = str(sp, "sort") ?? "name";
  const dir = str(sp, "sortDir") === "desc" ? "desc" : "asc";
  if (sort === "email") return { email: dir };
  if (sort === "role") return { role: dir };
  if (sort === "department") return { department: dir };
  return { name: dir };
}

// --- Risk factors ---

export function riskFactorWhere(sp: URLSearchParams): Prisma.RiskFactorWhereInput {
  const parts: Prisma.RiskFactorWhereInput[] = [];
  const q = str(sp, "q");
  const category = str(sp, "category");
  const active = bool(sp, "active");
  if (category) parts.push({ category });
  if (active !== undefined) parts.push({ active });
  if (q) {
    parts.push({
      OR: [
        { category: { contains: q, mode: "insensitive" } },
        { factorName: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ],
    });
  }
  if (!parts.length) return {};
  if (parts.length === 1) return parts[0];
  return { AND: parts };
}

export function riskFactorOrderBy(sp: URLSearchParams): Prisma.RiskFactorOrderByWithRelationInput[] {
  const sort = str(sp, "sort") ?? "category";
  const dir = str(sp, "sortDir") === "desc" ? "desc" : "asc";
  if (sort === "factorName") return [{ factorName: dir }];
  if (sort === "weight") return [{ weight: dir }];
  return [{ category: dir }, { factorName: dir }];
}

// --- Calendar events ---

export function calendarEventWhere(sp: URLSearchParams): Prisma.CalendarEventWhereInput {
  const filters = filtersFromSearchParams(sp);
  const parts: Prisma.CalendarEventWhereInput[] = [];
  if (filters.departmentId) {
    parts.push({ release: { departmentId: filters.departmentId } });
  }
  if (filters.applicationId) {
    parts.push({ release: { applications: { some: { applicationId: filters.applicationId } } } });
  }
  const eventType = str(sp, "eventType");
  const releaseStatus = str(sp, "releaseStatus");
  if (eventType) parts.push({ eventType });
  if (releaseStatus) parts.push({ release: { status: releaseStatus } });
  if (!parts.length) return {};
  if (parts.length === 1) return parts[0];
  return { AND: parts };
}

export function referenceDataWhere(sp: URLSearchParams): Prisma.ReferenceDataWhereInput {
  const parts: Prisma.ReferenceDataWhereInput[] = [];
  const category = str(sp, "cat") ?? str(sp, "category");
  const active = bool(sp, "active");
  const includeInactive = sp.get("includeInactive") === "1";
  if (category) parts.push({ category });
  if (active !== undefined) parts.push({ active });
  else if (!includeInactive) parts.push({ active: true });
  if (!parts.length) return {};
  if (parts.length === 1) return parts[0];
  return { AND: parts };
}

export type { ReleaseListFilters };
