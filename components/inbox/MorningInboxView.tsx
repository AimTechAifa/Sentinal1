"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ProgressLink } from "@/components/layout/NavigationProgress";
import { SourceBadgeInline } from "@/components/dashboard/UnifiedPortfolioPanel";
import { TopBar } from "@/components/layout/TopBar";
import { ReleaseFiltersBar } from "@/components/releases/ReleaseFiltersBar";
import { TopActionsToday } from "@/components/inbox/TopActionsToday";
import { InboxCrmWidgets } from "@/components/inbox/InboxCrmWidgets";
import { DataTable, tableCell, tableHeadRow, tableRow } from "@/components/ui/data-table";
import { TableSkeleton } from "@/components/ui/TableSkeleton";
import { filterLabel } from "@/lib/release-filters";
import {
  inboxSectionLabel,
  inboxSectionOrder,
  type InboxItem,
  type InboxSection,
} from "@/lib/inbox-shared";
import { useReleaseFilters } from "@/context/ReleaseFiltersContext";
import { formatDate, cn } from "@/lib/utils";
import {
  AlertTriangle,
  CalendarClock,
  GitBranch,
  Package,
  Ticket,
  User,
} from "lucide-react";

type Period = "month" | "quarter" | "year";

type InboxData = {
  counts: Record<InboxSection, number>;
  items: InboxItem[];
};

const SECTION_ICONS: Record<InboxSection, typeof AlertTriangle> = {
  attention: AlertTriangle,
  p1: Ticket,
  approaching: CalendarClock,
  mapping: GitBranch,
  approvals: Package,
  mine: User,
};

const SECTION_FILTERS: { id: InboxSection | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "attention", label: "Blocked & at risk" },
  { id: "p1", label: "P1 issues" },
  { id: "approaching", label: "Undecided soon" },
  { id: "mapping", label: "Mapping" },
  { id: "approvals", label: "Approvals" },
  { id: "mine", label: "My releases" },
];

export function MorningInboxView() {
  const searchParams = useSearchParams();
  const [period, setPeriod] = useState<Period>("year");
  const [data, setData] = useState<InboxData | null>(null);
  const [loading, setLoading] = useState(true);
  const initialSection = (searchParams.get("section") as InboxSection | "all") || "all";
  const [section, setSection] = useState<InboxSection | "all">(
    SECTION_FILTERS.some((s) => s.id === initialSection) ? initialSection : "all"
  );
  const { filterQuery, filters, departments, applications, environments, hasRefinement } =
    useReleaseFilters();

  const scopeLabel = useMemo(
    () => filterLabel(filters, departments, applications, environments),
    [filters, departments, applications, environments]
  );

  useEffect(() => {
    setLoading(true);
    fetch(`/api/inbox?period=${period}${filterQuery}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((payload) => {
        if (payload) {
          setData({ counts: payload.counts, items: payload.items });
        }
        setLoading(false);
      });
  }, [period, filterQuery]);

  const filtered = useMemo(() => {
    if (!data) return [];
    if (section === "all") return data.items;
    return data.items.filter((i) => i.section === section);
  }, [data, section]);

  const grouped = useMemo(() => {
    const map = new Map<InboxSection, InboxItem[]>();
    filtered.forEach((item) => {
      const list = map.get(item.section) ?? [];
      list.push(item);
      map.set(item.section, list);
    });
    return Array.from(map.entries()).sort(
      (a, b) => inboxSectionOrder(a[0]) - inboxSectionOrder(b[0])
    );
  }, [filtered]);

  const totalCount = data?.items.length ?? 0;
  const attentionCount = data?.counts.attention ?? 0;

  return (
    <div className="space-y-6">
      <TopBar
        title="Morning Inbox"
        subtitle={
          hasRefinement
            ? `Action items for ${scopeLabel} — blocked releases, P1s, mapping conflicts, and more`
            : "Your daily action queue — blocked releases, P1s, mapping conflicts, and approvals"
        }
        highlight
      />

      <ReleaseFiltersBar />

      <TopActionsToday filterQuery={filterQuery} />

      <div className="flex gap-1 rounded-xl border border-gray-200 dark:border-[var(--border)] bg-white dark:bg-[var(--card)] p-1.5 w-fit shadow-sm">
        {(["month", "quarter", "year"] as Period[]).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPeriod(p)}
            className={cn(
              "rounded-lg px-4 py-1.5 text-xs font-bold capitalize transition-all duration-300",
              period === p 
                ? "bg-gray-100 dark:bg-gray-800 text-brand-600 dark:text-brand-400 shadow-sm" 
                : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50"
            )}
          >
            {p}
          </button>
        ))}
      </div>

      <InboxCrmWidgets
        loading={loading}
        totalCount={totalCount}
        attentionCount={attentionCount}
        p1Count={data?.counts.p1 ?? 0}
        mappingCount={data?.counts.mapping ?? 0}
        items={data?.items ?? []}
      />

      <div className="flex flex-wrap gap-2">
        {SECTION_FILTERS.map((f) => {
          const count =
            f.id === "all" ? totalCount : data?.counts[f.id as InboxSection] ?? 0;
          const active = section === f.id;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setSection(f.id)}
              className={cn(
                "rounded-full px-4 py-2 text-xs font-bold border transition-all duration-300",
                active
                  ? "bg-brand-500 text-white border-brand-500 shadow-sm -translate-y-0.5"
                  : "border-gray-200 dark:border-[var(--border)] bg-white dark:bg-[var(--card)] text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:shadow-sm"
              )}
            >
              {f.label}
              {count > 0 && <span className="ml-1.5 opacity-90 px-1.5 py-0.5 rounded-full bg-black/10 text-[10px] font-bold">{count}</span>}
            </button>
          );
        })}
      </div>

      {loading ? (
        <TableSkeleton columns={5} rows={6} showFilterBar={false} />
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 dark:border-[var(--border)] bg-white dark:bg-[var(--card)] px-8 py-16 text-center shadow-sm animate-fade-in-up">
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-tr from-emerald-100 to-teal-50 flex items-center justify-center mb-4 shadow-sm border border-emerald-200/50">
            <span className="text-2xl text-emerald-500">✨</span>
          </div>
          <p className="text-emerald-900 font-extrabold text-lg">Inbox clear for this scope</p>
          <p className="text-sm text-emerald-700/80 mt-2 font-medium">
            No action items match your filters. Check the{" "}
            <ProgressLink href="/dashboard" className="underline font-bold text-emerald-600 hover:text-emerald-800">
              Dashboard
            </ProgressLink>{" "}
            for portfolio overview.
          </p>
        </div>
      ) : section === "all" ? (
        <div className="space-y-6">
          {grouped.map(([sec, items]) => (
            <InboxSectionTable key={sec} section={sec} items={items} />
          ))}
        </div>
      ) : (
        <InboxSectionTable section={section as InboxSection} items={filtered} />
      )}
    </div>
  );
}

function InboxSectionTable({ section, items }: { section: InboxSection; items: InboxItem[] }) {
  const Icon = SECTION_ICONS[section];

  return (
    <DataTable
      title={inboxSectionLabel(section)}
      subtitle={`${items.length} item${items.length === 1 ? "" : "s"} requiring attention`}
      icon={Icon}
    >
      <table className="w-full text-sm">
        <thead>
          <tr className={tableHeadRow}>
            <th className={cn(tableCell, "text-left")}>Item</th>
            <th className={cn(tableCell, "text-left")}>Why</th>
            <th className={cn(tableCell, "text-left")}>Responsible</th>
            <th className={cn(tableCell, "text-left")}>When</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className={tableRow}>
              <td className={tableCell}>
                <div className="flex items-center gap-2 flex-wrap">
                  <SourceBadgeInline source={item.source} />
                  <ProgressLink href={item.href} className="font-medium text-brand-600 dark:text-brand-400 hover:underline">
                    {item.title}
                  </ProgressLink>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.subtitle}</p>
              </td>
              <td className={cn(tableCell, "text-xs text-gray-600 dark:text-gray-300 max-w-[240px]")}>{item.reason}</td>
              <td className={cn(tableCell, "font-medium text-gray-800 dark:text-gray-200")}>{item.responsible}</td>
              <td className={cn(tableCell, "text-xs text-gray-500 dark:text-gray-400")}>
                {item.date ? formatDate(item.date) : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </DataTable>
  );
}
