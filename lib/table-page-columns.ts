import type { ColumnDef } from "@/hooks/useColumnPreferences";

/** Stable page keys and column definitions for per-user column visibility. */

export const RELEASE_COLUMNS: ColumnDef[] = [
  { key: "releaseCode", label: "Release ID" },
  { key: "name", label: "Release Name" },
  { key: "department", label: "Department" },
  { key: "application", label: "Application" },
  { key: "releaseSize", label: "Release Size" },
  { key: "impact", label: "Impact" },
  { key: "priority", label: "Priority" },
  { key: "cabDate", label: "CAB Date" },
  { key: "startDate", label: "Start Date" },
  { key: "endDate", label: "End Date" },
  { key: "testEnvRequired", label: "Test Env Required" },
  { key: "uatEnvRequired", label: "UAT Env Required" },
  { key: "status", label: "Status" },
  { key: "conflictFlag", label: "Conflict Flag" },
  { key: "notes", label: "Notes" },
  { key: "readinessPercent", label: "Readiness %" },
  { key: "blockers", label: "Blockers" },
  { key: "vendorMaintenance", label: "Vendor Maintenance" },
  { key: "changeFreeze", label: "Change Freeze" },
  { key: "regulatory", label: "Regulatory" },
  { key: "releaseOwnerId", label: "Release Owner ID" },
  { key: "approvalStatus", label: "Approval Status" },
  { key: "dependsOn", label: "Depends On" },
  { key: "rollbackPlan", label: "Rollback Plan" },
  { key: "goLiveChecklistPercent", label: "Go-Live Checklist %" },
  { key: "stakeholderIds", label: "Stakeholder IDs" },
  { key: "deploymentWindow", label: "Deployment Window" },
];

export const DRIFT_COLUMNS: ColumnDef[] = [
  { key: "driftCode", label: "Drift" },
  { key: "release", label: "Release" },
  { key: "application", label: "Application" },
  { key: "environment", label: "Env" },
  { key: "type", label: "Type" },
  { key: "severity", label: "Severity" },
  { key: "status", label: "Status" },
  { key: "detected", label: "Detected" },
];

export const INCIDENT_COLUMNS: ColumnDef[] = [
  { key: "incidentCode", label: "Incident" },
  { key: "application", label: "Application" },
  { key: "severity", label: "Severity" },
  { key: "title", label: "Title" },
  { key: "status", label: "Status" },
  { key: "impact", label: "Impact" },
  { key: "relatedRelease", label: "Related Release" },
  { key: "assignedTo", label: "Assigned To" },
  { key: "environment", label: "Env" },
  { key: "timestamp", label: "Timestamp" },
];

export const APPLICATION_STATUS_COLUMNS: ColumnDef[] = [
  { key: "application", label: "Application" },
  { key: "environment", label: "Environment" },
  { key: "status", label: "Status" },
  { key: "uptimePercent", label: "Uptime %" },
  { key: "lastCheck", label: "Last Check" },
  { key: "notes", label: "Notes" },
];

export const ENVIRONMENT_COLUMNS: ColumnDef[] = [
  { key: "appId", label: "App ID" },
  { key: "application", label: "Application" },
  { key: "department", label: "Department" },
  { key: "environment", label: "Environment" },
  { key: "envOwner", label: "Env Owner" },
  { key: "version", label: "Version" },
  { key: "buildNumber", label: "Build Number" },
  { key: "deployDate", label: "Deploy Date" },
  { key: "deployedBy", label: "Deployed By" },
  { key: "status", label: "Status" },
  { key: "notes", label: "Notes" },
];

export const REFERENCE_DATA_COLUMNS: ColumnDef[] = [
  { key: "value", label: "Value" },
  { key: "sortOrder", label: "Sort Order" },
  { key: "active", label: "Active" },
];

export const RISK_COLUMNS: ColumnDef[] = [
  { key: "riskCode", label: "Risk ID" },
  { key: "release", label: "Release" },
  { key: "category", label: "Category" },
  { key: "description", label: "Description" },
  { key: "likelihood", label: "Likelihood" },
  { key: "impact", label: "Impact" },
  { key: "riskScore", label: "Risk Score" },
  { key: "affectedArea", label: "Affected Area" },
  { key: "mitigationStrategy", label: "Mitigation Strategy" },
  { key: "riskOwner", label: "Risk Owner" },
  { key: "status", label: "Status" },
  { key: "notes", label: "Notes" },
];

export const RISK_FACTOR_COLUMNS: ColumnDef[] = [
  { key: "category", label: "Category" },
  { key: "factorName", label: "Factor Name" },
  { key: "weight", label: "Weight" },
  { key: "description", label: "Description" },
  { key: "active", label: "Active" },
];

export const APPROVAL_COLUMNS: ColumnDef[] = [
  { key: "approvalCode", label: "Approval ID" },
  { key: "releaseId", label: "Release ID" },
  { key: "releaseName", label: "Release Name" },
  { key: "approvalType", label: "Approval Type" },
  { key: "approverId", label: "Approver ID" },
  { key: "approverName", label: "Approver Name" },
  { key: "approverRole", label: "Approver Role" },
  { key: "submittedDate", label: "Submitted Date" },
  { key: "decisionDate", label: "Decision Date" },
  { key: "decision", label: "Decision" },
  { key: "comments", label: "Comments" },
  { key: "cabMeetingId", label: "CAB Meeting ID" },
];

export const LEAVE_COLUMNS: ColumnDef[] = [
  { key: "leaveCode", label: "Leave ID" },
  { key: "staffMember", label: "Staff Member" },
  { key: "department", label: "Department" },
  { key: "type", label: "Type" },
  { key: "dates", label: "Dates" },
  { key: "days", label: "Days" },
  { key: "risk", label: "Risk" },
  { key: "affectedReleases", label: "Affected Releases" },
];

export const MONITORING_ALERT_COLUMNS: ColumnDef[] = [
  { key: "alertCode", label: "Alert" },
  { key: "application", label: "Application" },
  { key: "severity", label: "Severity" },
  { key: "metric", label: "Metric" },
  { key: "thresholdVsCurrent", label: "Threshold vs Current" },
  { key: "status", label: "Status" },
  { key: "assignedTo", label: "Assigned To" },
  { key: "environment", label: "Env" },
  { key: "timestamp", label: "Timestamp" },
];

export const PLANNED_MAINTENANCE_COLUMNS: ColumnDef[] = [
  { key: "scheduled", label: "Scheduled" },
  { key: "type", label: "Type" },
  { key: "application", label: "Application" },
  { key: "environment", label: "Env" },
  { key: "impact", label: "Impact" },
  { key: "approval", label: "Approval" },
  { key: "requestor", label: "Requestor" },
  { key: "notes", label: "Notes" },
];

export const DEPARTMENT_COLUMNS: ColumnDef[] = [
  { key: "name", label: "Department" },
  { key: "head", label: "Head" },
  { key: "applicationCount", label: "Applications" },
];

export const APPLICATION_COLUMNS: ColumnDef[] = [
  { key: "name", label: "Application" },
  { key: "department", label: "Department" },
  { key: "type", label: "Type" },
  { key: "criticality", label: "Criticality" },
  { key: "productOwner", label: "Product Owner" },
  { key: "techLead", label: "Tech Lead" },
  { key: "envCount", label: "Environments" },
];

export const USER_COLUMNS: ColumnDef[] = [
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "role", label: "Role" },
  { key: "department", label: "Department" },
  { key: "accessLevel", label: "Access Level" },
  { key: "status", label: "Status" },
  { key: "lastLogin", label: "Last Login" },
];

export const CALENDAR_TABLE_COLUMNS: ColumnDef[] = [
  { key: "month", label: "Month" },
  { key: "week", label: "Week" },
  { key: "date", label: "Date" },
  { key: "day", label: "Day" },
  { key: "eventType", label: "Event Type" },
  { key: "releaseCode", label: "Release ID" },
  { key: "releaseName", label: "Release Name" },
  { key: "department", label: "Department" },
  { key: "sizeImpact", label: "Size/Impact" },
  { key: "notes", label: "Notes" },
];

/** All page keys that support per-user column visibility (used for prefetch). */
export const TABLE_PAGE_KEYS = [
  "releases",
  "env-booking",
  "dependencies",
  "conflicts",
  "environments",
  "risks",
  "drifts",
  "approvals",
  "leaves",
  "monitoring-alerts",
  "incidents",
  "application-status",
  "planned-maintenance",
  "departments",
  "applications",
  "users",
  "risk-factors",
  "reference-data",
  "calendar-table",
] as const;
