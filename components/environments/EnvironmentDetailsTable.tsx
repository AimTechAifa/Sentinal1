"use client";

import { useMemo } from "react";
import { Server, Settings } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { cn } from "@/lib/utils";

function formatDate(iso?: string | Date | null) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(iso));
}

export function EnvironmentDetailsTable({
  versions,
  selectedApp,
  onSelectApp,
  isColumnVisible,
}: {
  versions: any[];
  selectedApp?: string | null;
  onSelectApp?: (app: string | null) => void;
  isColumnVisible: (key: string) => boolean;
}) {
  const rows = useMemo(() => {
    let list = versions;
    if (selectedApp) {
      list = list.filter((v) => v.application?.name === selectedApp);
    }
    
    // Sort first so we can assign sequential APP-IDs if needed, or just sort alphabetically
    const sorted = [...list].sort((a, b) => {
      if (a.application?.name !== b.application?.name) return (a.application?.name || "").localeCompare(b.application?.name || "");
      return (a.environment?.name || "").localeCompare(b.environment?.name || "");
    });

    // Create a map to assign sequential App IDs (APP-001, APP-002, etc.) based on application name
    const appIds = new Map<string, string>();
    let appCounter = 1;

    return sorted.map((v) => {
      const appName = v.application?.name ?? "Unknown";
      if (!appIds.has(appName)) {
        appIds.set(appName, `APP-${String(appCounter++).padStart(3, "0")}`);
      }

      return {
        appId: appIds.get(appName),
        application: appName,
        department: v.application?.department?.name ?? "Unknown",
        environment: v.environment?.type ?? v.environment?.name ?? "Unknown",
        envOwner: v.environment?.owner ?? "—",
        version: v.version ?? "—",
        buildNumber: v.buildNumber ?? "—",
        deployDate: v.deployDate,
        deployedBy: v.updatedBy ?? "—",
        status: v.status ?? "Unknown",
        notes: v.notes ?? "—",
      };
    });
  }, [versions, selectedApp]);

  const apps = useMemo(() => Array.from(new Set(versions.map((v) => v.application?.name))).filter(Boolean) as string[], [versions]);

  const visibleColCount = [
    "appId", "application", "department", "environment", "envOwner",
    "version", "buildNumber", "deployDate", "deployedBy", "status", "notes",
  ].filter((k) => isColumnVisible(k)).length;

  const tableRow = "border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors";
  const tableCell = "py-3 px-5 whitespace-nowrap text-sm align-middle";
  const tableHeadRow = "border-b-2 border-brand-100 text-brand-700 bg-brand-50/40 text-xs uppercase tracking-wider";

  return (
    <DataTable
      title="Environment Deployments"
      subtitle={selectedApp ? `Detailed configuration for ${selectedApp}` : "Detailed deployment configurations across all applications"}
      icon={Server}
      action={
        <div className="flex items-center gap-2">
          <label htmlFor="app-filter" className="text-xs font-medium text-gray-500">Filter:</label>
          <select
            id="app-filter"
            className="text-sm rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 py-1 pl-3 pr-8"
            value={selectedApp || ""}
            onChange={(e) => onSelectApp?.(e.target.value || null)}
          >
            <option value="">All Applications</option>
            {apps.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
      }
    >
      <table className="w-full min-w-[1200px] text-sm">
        <thead>
          <tr className={tableHeadRow}>
            {isColumnVisible("appId") && <th className={cn(tableCell, "text-left font-medium")}>App ID</th>}
            {isColumnVisible("application") && <th className={cn(tableCell, "text-left font-medium")}>Application</th>}
            {isColumnVisible("department") && <th className={cn(tableCell, "text-left font-medium")}>Department</th>}
            {isColumnVisible("environment") && <th className={cn(tableCell, "text-left font-medium")}>Environment</th>}
            {isColumnVisible("envOwner") && <th className={cn(tableCell, "text-left font-medium")}>Env Owner</th>}
            {isColumnVisible("version") && <th className={cn(tableCell, "text-left font-medium")}>Version</th>}
            {isColumnVisible("buildNumber") && <th className={cn(tableCell, "text-left font-medium")}>Build Number</th>}
            {isColumnVisible("deployDate") && <th className={cn(tableCell, "text-left font-medium")}>Deploy Date</th>}
            {isColumnVisible("deployedBy") && <th className={cn(tableCell, "text-left font-medium")}>Deployed By</th>}
            {isColumnVisible("status") && <th className={cn(tableCell, "text-left font-medium")}>Status</th>}
            {isColumnVisible("notes") && <th className={cn(tableCell, "text-left font-medium")}>Notes</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={`${row.appId}-${row.environment}-${i}`} className={tableRow}>
              {isColumnVisible("appId") && <td className={cn(tableCell, "font-medium text-gray-500")}>{row.appId}</td>}
              {isColumnVisible("application") && <td className={cn(tableCell, "font-medium text-gray-800")}>{row.application}</td>}
              {isColumnVisible("department") && <td className={cn(tableCell, "text-gray-600")}>{row.department}</td>}
              {isColumnVisible("environment") && (
              <td className={tableCell}>
                <span className="inline-flex rounded-md bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700">
                  {row.environment}
                </span>
              </td>
              )}
              {isColumnVisible("envOwner") && <td className={cn(tableCell, "text-gray-600 max-w-[160px] truncate")} title={row.envOwner}>{row.envOwner}</td>}
              {isColumnVisible("version") && <td className={cn(tableCell, "font-mono text-xs text-brand-600 font-semibold")}>{row.version}</td>}
              {isColumnVisible("buildNumber") && <td className={cn(tableCell, "font-mono text-[10px] text-gray-500")}>{row.buildNumber}</td>}
              {isColumnVisible("deployDate") && <td className={cn(tableCell, "text-gray-500 text-xs")}>{formatDate(row.deployDate)}</td>}
              {isColumnVisible("deployedBy") && <td className={cn(tableCell, "text-gray-600")}>{row.deployedBy}</td>}
              {isColumnVisible("status") && (
              <td className={tableCell}>
                <span
                  className={cn(
                    "inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                    row.status.toLowerCase() === "active" ? "bg-success-100 text-success-700" : "bg-gray-100 text-gray-700"
                  )}
                >
                  {row.status}
                </span>
              </td>
              )}
              {isColumnVisible("notes") && <td className={cn(tableCell, "text-gray-500 text-xs max-w-[200px] truncate")} title={row.notes}>{row.notes}</td>}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={visibleColCount} className="py-8 text-center text-gray-500 text-sm">
                No deployment data found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </DataTable>
  );
}
