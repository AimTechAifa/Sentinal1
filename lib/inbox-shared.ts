export type InboxSection =
  | "attention"
  | "p1"
  | "approaching"
  | "mapping"
  | "approvals"
  | "mine";

export type InboxItem = {
  id: string;
  section: InboxSection;
  priority: number;
  title: string;
  subtitle: string;
  reason: string;
  responsible: string;
  href: string;
  date: string | null;
  source: "database" | "demo";
};

export function inboxSectionLabel(section: InboxSection): string {
  const labels: Record<InboxSection, string> = {
    attention: "Blocked & at risk",
    p1: "Open P1 issues",
    approaching: "Undecided — target soon",
    mapping: "Mapping conflicts",
    approvals: "Overdue approvals",
    mine: "My releases",
  };
  return labels[section];
}

export function inboxSectionOrder(section: InboxSection): number {
  const order: Record<InboxSection, number> = {
    attention: 0,
    p1: 1,
    approaching: 2,
    mapping: 3,
    approvals: 4,
    mine: 5,
  };
  return order[section];
}

export function sortInboxItems(items: InboxItem[]): InboxItem[] {
  return [...items].sort((a, b) => {
    const byPriority = a.priority - b.priority;
    if (byPriority !== 0) return byPriority;
    const bySection = inboxSectionOrder(a.section) - inboxSectionOrder(b.section);
    if (bySection !== 0) return bySection;
    if (a.date && b.date) return new Date(a.date).getTime() - new Date(b.date).getTime();
    return 0;
  });
}
