"use client";

import { useEffect, useMemo, useState } from "react";
import { ClipboardCheck, Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { DataTable, tableCell, tableHeadRow, tableRow } from "@/components/ui/data-table";
import { ProgressLink } from "@/components/layout/NavigationProgress";
import { cn, formatDate } from "@/lib/utils";

type ApprovalRow = {
  id: string;
  approvalCode: string;
  releaseId: string;
  release: { id: string; releaseCode: string; name: string; status: string; releaseDate: string };
  approvalType: string;
  approver: { id: string; userId: string; name: string; email: string; role: string };
  submittedDate: string;
  decisionDate: string | null;
  decision: string;
  comments: string | null;
  cabMeetingId: string | null;
};

type ViewMode = "all" | "pending" | "approved" | "rejected";

const GATE_ORDER = ["Tech Review", "Security Review", "Business Review", "Change Manager", "CAB Final"];

const DECISION_ICON: Record<string, React.ReactNode> = {
  Approved: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
  "Approved with Conditions": <AlertCircle className="h-4 w-4 text-amber-500" />,
  Pending: <Clock className="h-4 w-4 text-gray-400" />,
  Rejected: <XCircle className="h-4 w-4 text-red-500" />,
};

const DECISION_BG: Record<string, string> = {
  Approved: "bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/30",
  "Approved with Conditions": "bg-amber-50 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/30",
  Pending: "bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700",
  Rejected: "bg-red-50 border-red-200 dark:bg-red-500/10 dark:border-red-500/30",
};

export default function ApprovalQueueContent() {
  const [approvals, setApprovals] = useState<ApprovalRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/approvals")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setApprovals(d))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <TopBar
        title="Approval Queue"
        subtitle={`${approvals.length} approval${approvals.length === 1 ? "" : "s"} across all releases`}
      />

      {loading ? (
        <p className="text-gray-500 p-6">Loading…</p>
      ) : approvals.length === 0 ? (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-12 text-center">
          <ClipboardCheck className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No approvals found.</p>
        </div>
      ) : (
        <DataTable title="All Approvals" subtitle="Approval gates for releases" icon={ClipboardCheck}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className={tableHeadRow}>
                <tr>
                  <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Approval ID</th>
                  <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Release ID</th>
                  <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Release Name</th>
                  <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Approval Type</th>
                  <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Approver ID</th>
                  <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Approver Name</th>
                  <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Approver Role</th>
                  <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Submitted Date</th>
                  <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Decision Date</th>
                  <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Decision</th>
                  <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Comments</th>
                  <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>CAB Meeting ID</th>
                </tr>
              </thead>
              <tbody>
                {approvals.map((a) => (
                  <tr key={a.id} className={tableRow}>
                    <td className={`${tableCell} whitespace-nowrap`}>
                      <span className="font-mono text-xs text-brand-600 dark:text-brand-400">{a.approvalCode}</span>
                    </td>
                    <td className={`${tableCell} whitespace-nowrap`}>
                      <ProgressLink href={`/releases/${a.release.id}`} className="text-brand-600 dark:text-brand-400 hover:underline text-xs">
                        {a.release.releaseCode}
                      </ProgressLink>
                    </td>
                    <td className={`${tableCell} whitespace-nowrap`}>{a.release.name}</td>
                    <td className={`${tableCell} whitespace-nowrap`}>{a.approvalType}</td>
                    <td className={`${tableCell} whitespace-nowrap`}><span className="font-mono text-xs text-gray-500">{a.approver.userId}</span></td>
                    <td className={`${tableCell} whitespace-nowrap`}>{a.approver.name}</td>
                    <td className={`${tableCell} whitespace-nowrap text-gray-600 text-xs`}>{a.approver.role}</td>
                    <td className={`${tableCell} whitespace-nowrap text-gray-500`}>{formatDate(a.submittedDate)}</td>
                    <td className={`${tableCell} whitespace-nowrap text-gray-500`}>{a.decisionDate ? formatDate(a.decisionDate) : "—"}</td>
                    <td className={`${tableCell} whitespace-nowrap`}>
                      <div className="flex items-center gap-1.5">
                        {DECISION_ICON[a.decision] ?? <Clock className="h-4 w-4 text-gray-400" />}
                        <span className="font-medium">{a.decision}</span>
                      </div>
                    </td>
                    <td className={`${tableCell} truncate max-w-[200px] whitespace-nowrap`} title={a.comments ?? ""}>{a.comments ?? "—"}</td>
                    <td className={`${tableCell} whitespace-nowrap`}>{a.cabMeetingId ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DataTable>
      )}
    </div>
  );
}
