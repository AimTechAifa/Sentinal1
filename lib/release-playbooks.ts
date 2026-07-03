import type { ReleaseFormData } from "@/components/releases/ReleaseFormModal";

export type PlaybookLookups = {
  departments: { id: string; name: string }[];
  applications: { id: string; name: string; departmentId: string }[];
};

export type ReleasePlaybook = {
  id: string;
  title: string;
  description: string;
  departmentName: string;
  applicationNames: string[];
  name: string;
  programProject: string;
  status: string;
  priority: string;
  impact: string;
  releaseDateOffsetDays: number;
  bookingWindowDays: number;
  notes: string;
  checklist: string[];
};

export const RELEASE_PLAYBOOKS: ReleasePlaybook[] = [
  {
    id: "fin-patch",
    title: "FIN patch",
    description: "Standard finance patch — FIN app, UAT window, medium blast radius",
    departmentName: "FIN",
    applicationNames: ["FIN"],
    name: "FIN scheduled patch",
    programProject: "FIN Maintenance",
    status: "Planned",
    priority: "Medium",
    impact: "Medium",
    releaseDateOffsetDays: 14,
    bookingWindowDays: 7,
    notes: "Use for routine FIN patches — book FIN UAT before target date.",
    checklist: [
      "Link FIN application",
      "Book FIN UAT for integration window",
      "Verify system mapping to SAP TEST if coupled",
      "Record Go / No-Go 48h before target",
    ],
  },
  {
    id: "platform-sap",
    title: "Platform SAP release",
    description: "Critical SAP platform drop — high impact, cross-team bookings",
    departmentName: "Platform",
    applicationNames: ["SAP"],
    name: "SAP platform release",
    programProject: "Core Banking Transformation",
    status: "Planned",
    priority: "High",
    impact: "High",
    releaseDateOffsetDays: 21,
    bookingWindowDays: 10,
    notes: "Coordinate SAP TEST with FIN/CRM downstream mapping checks.",
    checklist: [
      "Book SAP TEST early — check calendar capacity",
      "Review downstream releases (CRM, Payments)",
      "Run mapping risk check for target window",
      "Security + CAB sign-off before Go",
    ],
  },
  {
    id: "crm-feature",
    title: "CRM feature",
    description: "CRM enhancement with platform dependency gate",
    departmentName: "CRM",
    applicationNames: ["CRM"],
    name: "CRM feature release",
    programProject: "Digital CRM",
    status: "Planned",
    priority: "Medium",
    impact: "Medium",
    releaseDateOffsetDays: 21,
    bookingWindowDays: 7,
    notes: "Confirm upstream platform release is Go before CRM deploy.",
    checklist: [
      "Set dependency on active platform release if applicable",
      "Book CRM DEV → TEST promotion window",
      "Link Jira epic/stories",
    ],
  },
  {
    id: "hotfix",
    title: "Hotfix",
    description: "Expedited fix — 3-day target, high priority",
    departmentName: "FIN",
    applicationNames: ["FIN"],
    name: "Hotfix",
    programProject: "N/A",
    status: "In Progress",
    priority: "High",
    impact: "Medium",
    releaseDateOffsetDays: 3,
    bookingWindowDays: 2,
    notes: "Hotfix path — minimal scope, fast env booking, No-Go if build red.",
    checklist: [
      "Link P1/P2 Jira bug",
      "Book env immediately",
      "Notify stakeholders via comms draft",
    ],
  },
];

function offsetDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function nextReleaseCode(existingCodes: string[]): string {
  const year = new Date().getFullYear();
  const prefix = `RD-${year}-`;
  const nums = existingCodes
    .filter((c) => c.startsWith(prefix))
    .map((c) => parseInt(c.slice(prefix.length), 10))
    .filter((n) => !Number.isNaN(n));
  const next = nums.length ? Math.max(...nums) + 1 : 120;
  return `${prefix}${String(next).padStart(4, "0")}`;
}

export function resolvePlaybookForm(
  playbook: ReleasePlaybook,
  lookups: PlaybookLookups,
  existingCodes: string[],
  owner: string
): Partial<ReleaseFormData> {
  const dept = lookups.departments.find((d) => d.name === playbook.departmentName);
  const appIds = playbook.applicationNames
    .map((name) => lookups.applications.find((a) => a.name === name)?.id)
    .filter(Boolean) as string[];

  const checklist = playbook.checklist.map((c) => `• ${c}`).join("\n");

  return {
    releaseCode: nextReleaseCode(existingCodes),
    name: playbook.name,
    programProject: playbook.programProject,
    owner,
    status: playbook.status,
    releaseDate: offsetDate(playbook.releaseDateOffsetDays),
    priority: playbook.priority,
    impact: playbook.impact,
    departmentId: dept?.id ?? "",
    applicationIds: appIds,
    dependsOnReleaseIds: [],
    notes: `${playbook.notes}\n\nChecklist:\n${checklist}`,
  };
}

export type CloneSource = {
  releaseCode: string;
  name: string;
  programProject: string | null;
  owner: string;
  status: string;
  releaseDate: string;
  priority: string;
  impact: string;
  departmentId: string;
  applicationIds: string[];
  dependsOnReleaseIds: string[];
  notes?: string | null;
};

export function cloneReleaseForm(
  source: CloneSource,
  existingCodes: string[]
): Partial<ReleaseFormData> {
  return {
    releaseCode: nextReleaseCode(existingCodes),
    name: `${source.name} (copy)`,
    programProject: source.programProject ?? "",
    owner: source.owner,
    status: "Planned",
    releaseDate: offsetDate(14),
    priority: source.priority,
    impact: source.impact,
    departmentId: source.departmentId,
    applicationIds: [...source.applicationIds],
    dependsOnReleaseIds: [...source.dependsOnReleaseIds],
    notes: source.notes
      ? `Cloned from ${source.releaseCode}.\n\n${source.notes}`
      : `Cloned from ${source.releaseCode}.`,
  };
}

export function playbookBookingHint(playbook: ReleasePlaybook): {
  offsetDays: number;
  durationDays: number;
  purpose: string;
} {
  return {
    offsetDays: Math.max(1, playbook.releaseDateOffsetDays - playbook.bookingWindowDays),
    durationDays: playbook.bookingWindowDays,
    purpose: `${playbook.title} — test window`,
  };
}

export function playbookBookingDates(playbook: ReleasePlaybook): {
  fromDate: string;
  toDate: string;
  purpose: string;
} {
  const hint = playbookBookingHint(playbook);
  return {
    fromDate: offsetDate(hint.offsetDays),
    toDate: offsetDate(hint.offsetDays + hint.durationDays - 1),
    purpose: hint.purpose,
  };
}
