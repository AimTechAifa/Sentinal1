export type ConnectorTypeId = "jira" | "github" | "jenkins" | "servicenow" | "sonarqube";

export interface ConnectorTypeDef {
  id: ConnectorTypeId;
  label: string;
  authType: "api_key" | "oauth2" | "basic_token";
  available: boolean;
  defaultPollInterval: number;
  credentialFields: Array<{
    key: string;
    label: string;
    type: "text" | "password" | "url";
    placeholder?: string;
  }>;
  configFields: Array<{
    key: string;
    label: string;
    type: "text" | "select";
    placeholder?: string;
    options?: string[];
  }>;
  targetModel: "WorkItem" | "P1Issue";
}

export const CONNECTOR_TYPES: ConnectorTypeDef[] = [
  {
    id: "jira",
    label: "Jira",
    authType: "basic_token",
    available: true,
    defaultPollInterval: 15,
    credentialFields: [
      { key: "email", label: "Email", type: "text", placeholder: "you@company.com" },
      { key: "apiToken", label: "API Token", type: "password" },
    ],
    configFields: [{ key: "projectKey", label: "Project Key", type: "text", placeholder: "PROJ" }],
    targetModel: "WorkItem",
  },
  {
    id: "github",
    label: "GitHub",
    authType: "api_key",
    available: true,
    defaultPollInterval: 15,
    credentialFields: [{ key: "token", label: "Personal Access Token", type: "password" }],
    configFields: [{ key: "repo", label: "Repository", type: "text", placeholder: "owner/repo" }],
    targetModel: "WorkItem",
  },
  {
    id: "jenkins",
    label: "Jenkins",
    authType: "basic_token",
    available: true,
    defaultPollInterval: 15,
    credentialFields: [
      { key: "username", label: "Username", type: "text" },
      { key: "apiToken", label: "API Token", type: "password" },
    ],
    configFields: [{ key: "jobName", label: "Job Name", type: "text", placeholder: "my-pipeline" }],
    targetModel: "WorkItem",
  },
  {
    id: "servicenow",
    label: "ServiceNow",
    authType: "oauth2",
    available: false,
    defaultPollInterval: 30,
    credentialFields: [],
    configFields: [],
    targetModel: "P1Issue",
  },
  {
    id: "sonarqube",
    label: "SonarQube",
    authType: "api_key",
    available: false,
    defaultPollInterval: 30,
    credentialFields: [],
    configFields: [],
    targetModel: "WorkItem",
  },
];

export const POLL_INTERVAL_OPTIONS = [
  { value: 5, label: "Every 5 minutes" },
  { value: 15, label: "Every 15 minutes" },
  { value: 30, label: "Every 30 minutes" },
  { value: 60, label: "Hourly" },
];

export function getConnectorTypeDef(type: string): ConnectorTypeDef | undefined {
  return CONNECTOR_TYPES.find((t) => t.id === type);
}

export function statusBadge(status: string, enabled: boolean): { label: string; color: string; emoji: string } {
  if (!enabled || status === "DISABLED") {
    return { label: "Disabled", color: "bg-gray-100 text-gray-600", emoji: "⚪" };
  }
  switch (status) {
    case "CONNECTED":
      return { label: "Connected", color: "bg-green-100 text-green-800", emoji: "🟢" };
    case "ERROR":
      return { label: "Error", color: "bg-red-100 text-red-800", emoji: "🔴" };
    case "PENDING":
      return { label: "Pending", color: "bg-yellow-100 text-yellow-800", emoji: "🟡" };
    default:
      return { label: status, color: "bg-gray-100 text-gray-600", emoji: "⚪" };
  }
}
