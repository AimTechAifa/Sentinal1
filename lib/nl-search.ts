import type { SearchResult } from "./dummy-data";

export type NlSearchParse = {
  interpreted: string;
  redirectHref?: string;
  extraResults: SearchResult[];
};

const DEPT_ALIASES: Record<string, string> = {
  fin: "FIN",
  finance: "FIN",
  platform: "Platform",
  sap: "Platform",
  crm: "CRM",
  security: "Security",
  ops: "Operations",
  operations: "Operations",
};

function hasAny(q: string, terms: string[]): boolean {
  return terms.some((t) => q.includes(t));
}

export function parseNlSearch(
  query: string,
  departments: { id: string; name: string }[]
): NlSearchParse {
  const q = query.trim().toLowerCase();
  const extraResults: SearchResult[] = [];
  let interpreted = `Keyword search for “${query.trim()}”`;
  let redirectHref: string | undefined;

  const deptName = Object.entries(DEPT_ALIASES).find(([alias]) => q.includes(alias))?.[1]
    ?? departments.find((d) => q.includes(d.name.toLowerCase()))?.name;

  const dept = deptName ? departments.find((d) => d.name === deptName) : undefined;
  const deptParam = dept ? `dept=${dept.id}` : "";

  if (hasAny(q, ["what's blocked", "whats blocked", "blocked releases", "stuck releases", "needs attention"])) {
    redirectHref = deptParam ? `/releases?attention=1&${deptParam}` : "/releases?attention=1";
    interpreted = dept
      ? `Blocked & at-risk releases in ${dept.name}`
      : "All blocked and at-risk releases";
  } else if (hasAny(q, ["at risk", "at-risk", "atrisk"])) {
    redirectHref = deptParam
      ? `/releases?attention=1&status=At%20Risk&${deptParam}`
      : "/releases?attention=1&status=At%20Risk";
    interpreted = dept ? `At-risk releases in ${dept.name}` : "At-risk releases";
  } else if (q.includes("blocked") && dept) {
    redirectHref = `/releases?attention=1&status=Blocked&${deptParam}`;
    interpreted = `Blocked releases in ${dept.name}`;
  } else if (hasAny(q, ["my releases", "my release", "owned by me"])) {
    redirectHref = "/inbox?section=mine";
    interpreted = "Your owned releases in Morning Inbox";
  } else if (hasAny(q, ["p1", "p1 issue", "p1 issues", "sev 1", "severity 1"])) {
    redirectHref = "/inbox?section=p1";
    interpreted = "Open P1 issues";
  } else if (hasAny(q, ["go no-go", "go/no-go", "undecided", "no decision", "approaching"])) {
    redirectHref = "/inbox?section=approaching";
    interpreted = "Releases needing Go / No-Go soon";
  } else if (hasAny(q, ["mapping risk", "mapping conflict", "mapping"])) {
    redirectHref = "/inbox?section=mapping";
    interpreted = "Mapping risks in Morning Inbox";
  } else if (hasAny(q, ["morning inbox", "inbox", "today"])) {
    redirectHref = "/inbox";
    interpreted = "Morning Inbox — your daily queue";
  } else if (hasAny(q, ["no booking", "without booking", "unbooked", "book env"])) {
    redirectHref = deptParam ? `/booking?${deptParam}` : "/booking";
    interpreted = dept
      ? `Environment booking for ${dept.name}`
      : "Environment booking — reserve test windows";
    extraResults.push({
      id: "nl-booking",
      type: "change",
      label: "Environment Booking",
      sublabel: interpreted,
      href: redirectHref,
    });
  } else if (dept && hasAny(q, ["this month", "this quarter", "releases"])) {
    redirectHref = `/releases?${deptParam}`;
    interpreted = `${dept.name} releases`;
  } else if (dept && q.includes("blocked")) {
    redirectHref = `/releases?attention=1&${deptParam}`;
    interpreted = `Blocked releases in ${dept.name}`;
  }

  if (redirectHref && !extraResults.length) {
    extraResults.push({
      id: `nl-${redirectHref}`,
      type: "change",
      label: interpreted,
      sublabel: "Natural language match · Open view",
      href: redirectHref,
    });
  }

  return { interpreted, redirectHref, extraResults };
}
