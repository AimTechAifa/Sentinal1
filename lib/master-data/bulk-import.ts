import { apiJson } from "@/lib/master-data/api";

export type ImportFieldDef = {
  key: string;
  label: string;
  required?: boolean;
};

export type ImportRowIssue = {
  row: number;
  message: string;
};

export type ImportSummary = {
  created: number;
  skipped: number;
  failed: number;
  errors: string[];
};

export type ValidatedImport<T> = {
  valid: T[];
  issues: ImportRowIssue[];
};

export function validateDepartmentImport(
  rows: Record<string, string>[],
  existingNames: Set<string>
): ValidatedImport<{ name: string; head: string }> {
  const valid: { name: string; head: string }[] = [];
  const issues: ImportRowIssue[] = [];
  const seen = new Set<string>();

  rows.forEach((row, idx) => {
    const rowNum = idx + 2;
    const name = row.name?.trim() ?? "";
    const head = row.head?.trim() ?? "";
    if (!name) {
      issues.push({ row: rowNum, message: "Missing required field: name" });
      return;
    }
    const key = name.toLowerCase();
    if (seen.has(key)) {
      issues.push({ row: rowNum, message: `Duplicate in file: ${name}` });
      return;
    }
    seen.add(key);
    if (existingNames.has(key)) {
      issues.push({ row: rowNum, message: `Already exists: ${name}` });
      return;
    }
    valid.push({ name, head });
  });

  return { valid, issues };
}

export async function runDepartmentImport(
  rows: { name: string; head: string }[]
): Promise<ImportSummary> {
  const summary: ImportSummary = { created: 0, skipped: 0, failed: 0, errors: [] };
  for (const row of rows) {
    try {
      await apiJson("/api/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(row),
      });
      summary.created++;
    } catch (e) {
      summary.failed++;
      summary.errors.push(`${row.name}: ${e instanceof Error ? e.message : "failed"}`);
    }
  }
  return summary;
}

export const DEPARTMENT_IMPORT_FIELDS: ImportFieldDef[] = [
  { key: "name", label: "Name", required: true },
  { key: "head", label: "Head" },
];

export function validateApplicationImport(
  rows: Record<string, string>[],
  deptByName: Map<string, string>,
  existingKeys: Set<string>
): ValidatedImport<{
  name: string;
  departmentId: string;
  type: string;
  productOwner: string;
  techLead: string;
  support: string;
  criticality: string;
}> {
  const valid: {
    name: string;
    departmentId: string;
    type: string;
    productOwner: string;
    techLead: string;
    support: string;
    criticality: string;
  }[] = [];
  const issues: ImportRowIssue[] = [];
  const seen = new Set<string>();

  rows.forEach((row, idx) => {
    const rowNum = idx + 2;
    const name = row.name?.trim() ?? "";
    const deptName = row.department?.trim() ?? "";
    if (!name) {
      issues.push({ row: rowNum, message: "Missing required field: name" });
      return;
    }
    if (!deptName) {
      issues.push({ row: rowNum, message: "Missing required field: department" });
      return;
    }
    const deptId = deptByName.get(deptName.toLowerCase());
    if (!deptId) {
      issues.push({ row: rowNum, message: `Unknown department: ${deptName}` });
      return;
    }
    const key = `${deptId}:${name.toLowerCase()}`;
    if (seen.has(key) || existingKeys.has(key)) {
      issues.push({ row: rowNum, message: `Duplicate application: ${name}` });
      return;
    }
    seen.add(key);
    valid.push({
      name,
      departmentId: deptId,
      type: row.type?.trim() || "General",
      productOwner: row.productOwner?.trim() || "",
      techLead: row.techLead?.trim() || "",
      support: row.support?.trim() || "",
      criticality: row.criticality?.trim() || "Medium",
    });
  });

  return { valid, issues };
}

export async function runApplicationImport(
  rows: {
    name: string;
    departmentId: string;
    type: string;
    productOwner: string;
    techLead: string;
    support: string;
    criticality: string;
  }[]
): Promise<ImportSummary> {
  const summary: ImportSummary = { created: 0, skipped: 0, failed: 0, errors: [] };
  for (const row of rows) {
    try {
      await apiJson("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(row),
      });
      summary.created++;
    } catch (e) {
      summary.failed++;
      summary.errors.push(`${row.name}: ${e instanceof Error ? e.message : "failed"}`);
    }
  }
  return summary;
}

export const APPLICATION_IMPORT_FIELDS: ImportFieldDef[] = [
  { key: "name", label: "Name", required: true },
  { key: "department", label: "Department", required: true },
  { key: "type", label: "Type" },
  { key: "productOwner", label: "Product Owner" },
  { key: "techLead", label: "Tech Lead" },
  { key: "support", label: "Support" },
  { key: "criticality", label: "Criticality" },
];

export const USER_IMPORT_FIELDS: ImportFieldDef[] = [
  { key: "name", label: "Name", required: true },
  { key: "email", label: "Email", required: true },
  { key: "role", label: "Role" },
  { key: "department", label: "Department" },
  { key: "manager", label: "Manager" },
  { key: "accessLevel", label: "Access Level" },
  { key: "status", label: "Status" },
];

export function validateUserImport(
  rows: Record<string, string>[],
  existingEmails: Set<string>
): ValidatedImport<{
  name: string;
  email: string;
  role: string;
  department: string;
  manager: string | null;
  accessLevel: string;
  status: string;
}> {
  const valid: {
    name: string;
    email: string;
    role: string;
    department: string;
    manager: string | null;
    accessLevel: string;
    status: string;
  }[] = [];
  const issues: ImportRowIssue[] = [];
  const seen = new Set<string>();

  rows.forEach((row, idx) => {
    const rowNum = idx + 2;
    const name = row.name?.trim() ?? "";
    const email = row.email?.trim() ?? "";
    if (!name || !email) {
      issues.push({ row: rowNum, message: "Name and email are required" });
      return;
    }
    const key = email.toLowerCase();
    if (seen.has(key) || existingEmails.has(key)) {
      issues.push({ row: rowNum, message: `Duplicate email: ${email}` });
      return;
    }
    seen.add(key);
    valid.push({
      name,
      email,
      role: row.role?.trim() || "Developer",
      department: row.department?.trim() || "",
      manager: row.manager?.trim() || null,
      accessLevel: row.accessLevel?.trim() || "Standard",
      status: row.status?.trim() || "Active",
    });
  });

  return { valid, issues };
}

export async function runUserImport(
  rows: {
    name: string;
    email: string;
    role: string;
    department: string;
    manager: string | null;
    accessLevel: string;
    status: string;
  }[]
): Promise<ImportSummary> {
  const summary: ImportSummary = { created: 0, skipped: 0, failed: 0, errors: [] };
  for (const row of rows) {
    try {
      await apiJson("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(row),
      });
      summary.created++;
    } catch (e) {
      summary.failed++;
      summary.errors.push(`${row.email}: ${e instanceof Error ? e.message : "failed"}`);
    }
  }
  return summary;
}

export const ENVIRONMENT_IMPORT_FIELDS: ImportFieldDef[] = [
  { key: "application", label: "Application", required: true },
  { key: "name", label: "Name", required: true },
  { key: "type", label: "Type" },
  { key: "owner", label: "Owner" },
  { key: "status", label: "Status" },
];

export function validateEnvironmentImport(
  rows: Record<string, string>[],
  appByName: Map<string, string>,
  existingKeys: Set<string>
): ValidatedImport<{
  name: string;
  type: string;
  owner: string;
  status: string;
  applicationId: string;
}> {
  const valid: {
    name: string;
    type: string;
    owner: string;
    status: string;
    applicationId: string;
  }[] = [];
  const issues: ImportRowIssue[] = [];
  const seen = new Set<string>();

  rows.forEach((row, idx) => {
    const rowNum = idx + 2;
    const appName = row.application?.trim() ?? "";
    const name = row.name?.trim() ?? "";
    if (!appName) {
      issues.push({ row: rowNum, message: "Missing required field: application" });
      return;
    }
    if (!name) {
      issues.push({ row: rowNum, message: "Missing required field: name" });
      return;
    }
    const appId = appByName.get(appName.toLowerCase());
    if (!appId) {
      issues.push({ row: rowNum, message: `Unknown application: ${appName}` });
      return;
    }
    const key = `${appId}:${name.toLowerCase()}`;
    if (seen.has(key) || existingKeys.has(key)) {
      issues.push({ row: rowNum, message: `Duplicate environment: ${name}` });
      return;
    }
    seen.add(key);
    valid.push({
      name,
      applicationId: appId,
      type: row.type?.trim() || "General",
      owner: row.owner?.trim() || "",
      status: row.status?.trim() || "Available",
    });
  });

  return { valid, issues };
}

export const RISK_FACTOR_IMPORT_FIELDS: ImportFieldDef[] = [
  { key: "category", label: "Category", required: true },
  { key: "factorName", label: "Factor Name", required: true },
  { key: "weight", label: "Weight", required: true },
  { key: "description", label: "Description" },
];

export function validateRiskFactorImport(
  rows: Record<string, string>[],
  existingNames: Set<string>
): ValidatedImport<{ category: string; factorName: string; weight: number; description: string }> {
  const valid: { category: string; factorName: string; weight: number; description: string }[] = [];
  const issues: ImportRowIssue[] = [];
  const seen = new Set<string>();

  rows.forEach((row, idx) => {
    const rowNum = idx + 2;
    const category = row.category?.trim() ?? "";
    const factorName = row.factorName?.trim() ?? "";
    const weightRaw = row.weight?.trim() ?? "";
    if (!category) {
      issues.push({ row: rowNum, message: "Missing required field: category" });
      return;
    }
    if (!factorName) {
      issues.push({ row: rowNum, message: "Missing required field: factorName" });
      return;
    }
    const weight = Number(weightRaw);
    if (!weightRaw || Number.isNaN(weight) || weight <= 0) {
      issues.push({ row: rowNum, message: `Invalid weight: "${weightRaw}"` });
      return;
    }
    const key = factorName.toLowerCase();
    if (seen.has(key)) {
      issues.push({ row: rowNum, message: `Duplicate in file: ${factorName}` });
      return;
    }
    seen.add(key);
    if (existingNames.has(key)) {
      issues.push({ row: rowNum, message: `Already exists: ${factorName}` });
      return;
    }
    valid.push({ category, factorName, weight, description: row.description?.trim() ?? "" });
  });

  return { valid, issues };
}

export async function runRiskFactorImport(
  rows: { category: string; factorName: string; weight: number; description: string }[]
): Promise<ImportSummary> {
  const summary: ImportSummary = { created: 0, skipped: 0, failed: 0, errors: [] };
  for (const row of rows) {
    try {
      await apiJson("/api/risk-factors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(row),
      });
      summary.created++;
    } catch (e) {
      summary.failed++;
      summary.errors.push(`${row.factorName}: ${e instanceof Error ? e.message : "failed"}`);
    }
  }
  return summary;
}

export async function runEnvironmentImport(
  rows: {
    name: string;
    type: string;
    owner: string;
    status: string;
    applicationId: string;
  }[]
): Promise<ImportSummary> {
  const summary: ImportSummary = { created: 0, skipped: 0, failed: 0, errors: [] };
  for (const row of rows) {
    try {
      await apiJson("/api/environments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(row),
      });
      summary.created++;
    } catch (e) {
      summary.failed++;
      summary.errors.push(`${row.name}: ${e instanceof Error ? e.message : "failed"}`);
    }
  }
  return summary;
}
