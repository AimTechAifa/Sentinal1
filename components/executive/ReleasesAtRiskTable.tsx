"use client";

import { ProgressLink } from "@/components/layout/NavigationProgress";
import { StatusBadge } from "@/components/badges/StatusBadge";
import { DataTable, tableCell, tableHeadRow, tableRow } from "@/components/ui/data-table";
import type { ReleasePrediction } from "@/lib/types";
import { formatDate, cn } from "@/lib/utils";
import { getRiskTextColor } from "@/lib/predictive";
import { AlertTriangle } from "lucide-react";

export function ReleasesAtRiskTable({ predictions }: { predictions: ReleasePrediction[] }) {
  const atRisk = predictions.filter((p) => p.shipSuccessPct < 65 || p.rollbackRiskPct >= 20).slice(0, 8);

  return (
    <DataTable title="Releases at Risk — ML Forecast" icon={AlertTriangle}>
      <table className="w-full text-theme-sm">
        <thead className={tableHeadRow}>
          <tr>
            <th className={`${tableCell} text-left font-medium`}>Release</th>
            <th className={`${tableCell} text-left font-medium`}>Team</th>
            <th className={`${tableCell} text-left font-medium`}>Target</th>
            <th className={`${tableCell} text-left font-medium`}>Ship success</th>
            <th className={`${tableCell} text-left font-medium`}>Rollback risk</th>
            <th className={`${tableCell} text-left font-medium`}>Delay risk</th>
            <th className={`${tableCell} text-left font-medium`}>Confidence</th>
          </tr>
        </thead>
        <tbody>
          {atRisk.map((p) => (
            <tr key={p.releaseId} className={tableRow}>
              <td className={tableCell}>
                <ProgressLink href={`/releases/${p.releaseId}`} className="font-medium text-brand-500 hover:underline">
                  {p.version}
                </ProgressLink>
              </td>
              <td className={`${tableCell} text-gray-600`}>{p.team}</td>
              <td className={`${tableCell} text-gray-500`}>{formatDate(p.targetDate)}</td>
              <td className={cn(tableCell, "font-medium", getRiskTextColor(100 - p.shipSuccessPct))}>
                {p.shipSuccessPct}%
              </td>
              <td className={cn(tableCell, "font-medium", getRiskTextColor(p.rollbackRiskPct))}>
                {p.rollbackRiskPct}%
              </td>
              <td className={`${tableCell} text-gray-600`}>{p.delayRiskPct}%</td>
              <td className={tableCell}>
                <StatusBadge status={p.confidence >= 85 ? "Approved" : p.confidence >= 70 ? "Pending" : "At Risk"} />
                <span className="ml-1 text-gray-500">{p.confidence}%</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </DataTable>
  );
}
