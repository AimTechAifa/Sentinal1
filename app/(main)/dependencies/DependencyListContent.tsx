"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Network } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { DataTable, tableCell, tableHeadRow, tableRow } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/badges/StatusBadge";
import { ProgressLink } from "@/components/layout/NavigationProgress";
import { cn } from "@/lib/utils";

type DepRow = {
  id: string;
  releaseId: string;
  dependsOnReleaseId: string;
  release: { id: string; releaseCode: string; name: string; status: string; releaseDate: string };
  dependsOnRelease: { id: string; releaseCode: string; name: string; status: string; releaseDate: string };
  dependencyType: string | null;
  status: string | null;
  impactIfBlocked: string | null;
  notes: string | null;
};

type StatusFilterMode = "all" | "Blocked" | "At Risk" | "Clear" | "Resolved";

const TYPE_CLASSES: Record<string, string> = {
  Hard: "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300",
  Soft: "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300",
  Technical: "bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-300",
  Data: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300",
  Integration: "bg-cyan-100 text-cyan-800 dark:bg-cyan-500/20 dark:text-cyan-300",
};

const VALID_STATUS_FILTERS: StatusFilterMode[] = ["all", "Blocked", "At Risk", "Clear", "Resolved"];

export default function DependencyListContent() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get("status");
  const [deps, setDeps] = useState<DepRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilterMode>(
    VALID_STATUS_FILTERS.includes(initialStatus as StatusFilterMode) ? (initialStatus as StatusFilterMode) : "all"
  );

  useEffect(() => {
    fetch("/api/dependencies")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setDeps(d))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (statusFilter === "all") return deps;
    return deps.filter((d) => d.status === statusFilter);
  }, [deps, statusFilter]);

  const blockedCount = deps.filter((d) => d.status === "Blocked" || d.status === "At Risk").length;
  const filters: StatusFilterMode[] = ["all", "Blocked", "At Risk", "Clear", "Resolved"];

  return (
    <div>
      <TopBar
        title="Release Dependencies"
        subtitle={`${deps.length} dependenc${deps.length === 1 ? "y" : "ies"}${blockedCount > 0 ? ` · ${blockedCount} blocked/at risk` : ""}`}
      />

      <div className="flex flex-wrap gap-2 mb-4">
        {filters.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatusFilter(s)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-medium capitalize border transition-colors",
              statusFilter === s
                ? "bg-brand-500 text-white border-brand-500"
                : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-brand-300"
            )}
          >
            {s === "all" ? "All" : s}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-500 p-6">Loading…</p>
      ) : (
        <DataTable title="All Dependencies" subtitle="Release-to-release dependency relationships" icon={Network}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className={tableHeadRow}>
                <tr>
                  <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Dep ID</th>
                  <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Release ID</th>
                  <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Release Name</th>
                  <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Depends On Release</th>
                  <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Depends On Name</th>
                  <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Dependency Type</th>
                  <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Status</th>
                  <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Impact if Blocked</th>
                  <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Notes</th>
                </tr>
              </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className={`${tableCell} text-center text-gray-400 py-8`}>
                    No dependencies found.
                  </td>
                </tr>
              ) : (
                filtered.map((d) => (
                  <tr key={d.id} className={tableRow}>
                    <td className={`${tableCell} whitespace-nowrap text-gray-900`}>{d.id.startsWith("DEP-") ? d.id : "—"}</td>
                    <td className={`${tableCell} whitespace-nowrap`}>
                      <ProgressLink href={`/releases/${d.release.id}`} className="font-mono text-xs text-brand-600 dark:text-brand-400 hover:underline">
                        {d.release.releaseCode}
                      </ProgressLink>
                    </td>
                    <td className={`${tableCell} whitespace-nowrap text-gray-600 dark:text-gray-300`}>{d.release.name}</td>
                    <td className={`${tableCell} whitespace-nowrap`}>
                      <ProgressLink href={`/releases/${d.dependsOnRelease.id}`} className="font-mono text-xs text-brand-600 dark:text-brand-400 hover:underline">
                        {d.dependsOnRelease.releaseCode}
                      </ProgressLink>
                    </td>
                    <td className={`${tableCell} whitespace-nowrap text-gray-600 dark:text-gray-300`}>{d.dependsOnRelease.name}</td>
                    <td className={`${tableCell} whitespace-nowrap`}>
                      {d.dependencyType ? (
                        <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", TYPE_CLASSES[d.dependencyType] ?? "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300")}>
                          {d.dependencyType}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className={`${tableCell} whitespace-nowrap`}>
                      {d.status ? <StatusBadge status={d.status} /> : <span className="text-gray-400">—</span>}
                    </td>
                    <td className={`${tableCell} max-w-[200px] text-gray-600 dark:text-gray-300 truncate`} title={d.impactIfBlocked ?? ""}>{d.impactIfBlocked ?? "—"}</td>
                    <td className={`${tableCell} max-w-[200px] text-gray-500 dark:text-gray-400 text-xs truncate`} title={d.notes ?? ""}>{d.notes ?? "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
        </DataTable>
      )}
    </div>
  );
}
