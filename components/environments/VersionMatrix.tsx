"use client";

import { motion } from "framer-motion";
import { AlertTriangle, ExternalLink, Layers } from "lucide-react";
import { ProgressLink } from "@/components/layout/NavigationProgress";
import { DataTable, tableCell, tableHeadRow, tableRow } from "@/components/ui/data-table";
import type { ApplicationVersionRow } from "@/lib/types";
import { cn } from "@/lib/utils";

export function VersionMatrix({
  rows,
  selectedApp,
  onSelectApp,
  onPromote,
  canPromote,
}: {
  rows: ApplicationVersionRow[];
  selectedApp?: string | null;
  onSelectApp?: (app: string | null) => void;
  onPromote?: (application: string, fromStage: "dev" | "test" | "prod", toStage: "dev" | "test" | "prod") => void;
  canPromote?: boolean;
}) {
  const driftCount = rows.filter((r) => r.drift).length;

  return (
    <DataTable
      title="Current Version"
      subtitle={`Promotion matrix across DEV → TEST → PROD · ${driftCount} app${driftCount === 1 ? "" : "s"} with drift`}
      icon={Layers}
      action={
        driftCount > 0 ? (
          <span className="inline-flex items-center gap-1 rounded-lg bg-warning-50 px-2.5 py-1 text-xs font-medium text-warning-700 border border-warning-200">
            <AlertTriangle className="h-3.5 w-3.5" /> Promotion gap detected
          </span>
        ) : undefined
      }
    >
      <table className="w-full text-sm">
        <thead>
          <tr className={tableHeadRow}>
            <th className={cn(tableCell, "text-left font-medium")}>Application</th>
            <th className={cn(tableCell, "text-left font-medium")}>DEV</th>
            <th className={cn(tableCell, "text-left font-medium")}>TEST</th>
            <th className={cn(tableCell, "text-left font-medium")}>PROD</th>
            <th className={cn(tableCell, "text-left font-medium")}>Promotion</th>
            <th className={cn(tableCell, "text-left font-medium")}>Recommendation</th>
            <th className={cn(tableCell, "text-left font-medium")} />
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <motion.tr
              key={row.application}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.04 }}
              className={cn(
                tableRow,
                "cursor-pointer",
                selectedApp === row.application && "bg-brand-50/60"
              )}
              onClick={() => onSelectApp?.(selectedApp === row.application ? null : row.application)}
            >
              <td className={cn(tableCell, "font-semibold text-gray-800")}>
                <div>{row.application}</div>
                {row.team && <div className="text-[10px] font-normal text-gray-400">{row.team} team</div>}
              </td>
              <td className={tableCell}>
                <VersionBadge version={row.dev} ahead={row.dev !== row.prod} />
              </td>
              <td className={tableCell}>
                <VersionBadge version={row.test} ahead={row.test !== row.prod} />
              </td>
              <td className={tableCell}>
                <VersionBadge version={row.prod} prod />
              </td>
              <td className={tableCell}>
                <PromotionBar pct={row.promotionPct} drift={row.drift} />
              </td>
              <td className={cn(tableCell, "text-xs text-gray-600 max-w-[140px]")}>
                {row.promotionPct === 100 ? (
                  <span className="text-success-600 font-medium">In sync</span>
                ) : row.promotionPct >= 66 ? (
                  <span>Promote TEST → PROD</span>
                ) : (
                  <span>Promote DEV → TEST first</span>
                )}
              </td>
              <td className={tableCell}>
                <div className="flex flex-col gap-1">
                  {row.releaseId && (
                    <ProgressLink
                      href={`/releases/${row.releaseId}`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700"
                    >
                      View <ExternalLink className="h-3 w-3" />
                    </ProgressLink>
                  )}
                  {canPromote && onPromote && row.drift && row.promotionPct < 100 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onPromote(row.application, row.promotionPct <= 33 ? "dev" : "test", row.promotionPct <= 33 ? "test" : "prod");
                      }}
                      className="text-left text-xs font-medium text-brand-500 hover:text-brand-700"
                    >
                      Promote →
                    </button>
                  )}
                </div>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </DataTable>
  );
}

function VersionBadge({ version, ahead, prod }: { version: string; ahead?: boolean; prod?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-lg px-2.5 py-1 text-xs font-bold font-mono text-[10px] uppercase tracking-wider",
        prod ? "bg-gray-100 text-gray-700" : ahead ? "bg-brand-50 text-brand-700 ring-1 ring-brand-200" : "bg-success-50 text-success-700"
      )}
    >
      {version}
      {ahead && !prod && <span className="ml-1 text-[10px] font-normal opacity-60">↑</span>}
    </span>
  );
}

function PromotionBar({ pct, drift }: { pct: number; drift: boolean }) {
  return (
    <div className="flex items-center gap-2 min-w-[100px]">
      <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className={cn("h-full rounded-full", drift ? "bg-gradient-to-r from-brand-400 to-warning-400" : "bg-success-500")}
        />
      </div>
      <span className="text-[10px] font-mono text-[10px] uppercase tracking-wider text-gray-500 w-8">{pct}%</span>
    </div>
  );
}
