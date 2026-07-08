"use client";

import { useEffect, useMemo, useState } from "react";
import { ClipboardCheck, Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { DataTable, DataTableHeadRow, TableToolbar, tableCell, tableRow } from "@/components/ui/data-table";
import { ProgressLink } from "@/components/layout/NavigationProgress";
import { FilterSelect, TableFilterBar } from "@/components/filters/TableFilterBar";
import { APPROVAL_COLUMNS, APPROVALS_FILTER_FIELDS } from "@/lib/table-page-columns";
import { formatDate } from "@/lib/utils";
import { useFilteredFetch } from "@/hooks/useTableFilters";
import { useTablePageLoading } from "@/hooks/useTablePageLoading";
import { useTablePagePreferences } from "@/hooks/useTablePagePreferences";
import { TableSkeleton } from "@/components/ui/TableSkeleton";
import { PageDocumentation } from "@/components/help/PageDocumentation";
import { APPROVALS_FILTER_SCHEMA } from "@/lib/table-filters";

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

const DECISION_ICON: Record<string, React.ReactNode> = {
  Approved: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
  "Approved with Conditions": <AlertCircle className="h-4 w-4 text-amber-500" />,
  Pending: <Clock className="h-4 w-4 text-gray-400" />,
  Rejected: <XCircle className="h-4 w-4 text-red-500" />,
};

export default function ApprovalQueueContent() {
  const {
    rows: approvals,
    loading,
    values,
    setFilter,
    clearAll,
    hasActive,
    sortKey,
    sortDir,
    toggleSort,
  } = useFilteredFetch<ApprovalRow>("/api/approvals", APPROVALS_FILTER_SCHEMA, {
    defaultSortKey: "submittedDate",
    defaultSortDir: "desc",
    sortAccessors: {
      approvalCode: (r) => r.approvalCode,
      releaseId: (r) => r.release.releaseCode,
      releaseName: (r) => r.release.name,
      approvalType: (r) => r.approvalType,
      approverId: (r) => r.approver.userId,
      approverName: (r) => r.approver.name,
      approverRole: (r) => r.approver.role,
      submittedDate: (r) => new Date(r.submittedDate).getTime(),
      decisionDate: (r) => (r.decisionDate ? new Date(r.decisionDate).getTime() : 0),
      decision: (r) => r.decision,
      comments: (r) => r.comments ?? "",
      cabMeetingId: (r) => r.cabMeetingId ?? "",
    },
  });
  const [allApprovals, setAllApprovals] = useState<ApprovalRow[]>([]);
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetch("/api/approvals").then((r) => (r.ok ? r.json() : [])).then(setAllApprovals);
    fetch("/api/users").then((r) => (r.ok ? r.json() : [])).then(setUsers);
  }, []);

  const decisions = useMemo(() => [...new Set(allApprovals.map((a) => a.decision))].sort(), [allApprovals]);
  const types = useMemo(() => [...new Set(allApprovals.map((a) => a.approvalType))].sort(), [allApprovals]);

  const { isColumnVisible, columnPicker, filterPicker, isFilterVisible, prefsLoaded } = useTablePagePreferences(
    "approvals",
    APPROVAL_COLUMNS,
    APPROVALS_FILTER_FIELDS,
    { lockedKeys: ["approvalCode"] }
  );

  const tablePending = useTablePageLoading(loading, prefsLoaded);

  return (
    <div>
      <TopBar
        trailing={<PageDocumentation pageKey="approvals" />}
        title="Approval Queue" subtitle={`${approvals.length} approval${approvals.length === 1 ? "" : "s"} across all releases`} />
      {!tablePending && (
        <TableFilterBar hasActive={hasActive} onClear={clearAll} manageFilters={filterPicker}>
          {isFilterVisible("decision") && (
            <FilterSelect value={values.decision} onChange={(v) => setFilter("decision", v)}>
              <option value="">All decisions</option>
              {decisions.map((d) => <option key={d} value={d}>{d}</option>)}
            </FilterSelect>
          )}
          {isFilterVisible("approvalType") && (
            <FilterSelect value={values.approvalType} onChange={(v) => setFilter("approvalType", v)}>
              <option value="">All approval types</option>
              {types.map((t) => <option key={t} value={t}>{t}</option>)}
            </FilterSelect>
          )}
          {isFilterVisible("approverId") && (
            <FilterSelect value={values.approverId} onChange={(v) => setFilter("approverId", v)}>
              <option value="">All approvers</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </FilterSelect>
          )}
        </TableFilterBar>
      )}

      {tablePending ? (
        <TableSkeleton columns={APPROVAL_COLUMNS.length} />
      ) : approvals.length === 0 ? (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-12 text-center">
          <ClipboardCheck className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">{hasActive ? "No approvals match the selected filters." : "No approvals found."}</p>
        </div>
      ) : (
        <DataTable title="All Approvals" subtitle="Click column headers to sort" icon={ClipboardCheck} toolbar={<TableToolbar>{columnPicker}</TableToolbar>}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <DataTableHeadRow
                  columns={APPROVAL_COLUMNS}
                  isColumnVisible={isColumnVisible}
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onSort={toggleSort}
                />
              </thead>
              <tbody>
                {approvals.map((a) => (
                  <tr key={a.id} className={tableRow}>
                    {isColumnVisible("approvalCode") && (
                    <td className={`${tableCell} whitespace-nowrap`}>
                      <span className="font-mono text-xs text-brand-600 dark:text-brand-400">{a.approvalCode}</span>
                    </td>
                    )}
                    {isColumnVisible("releaseId") && (
                    <td className={`${tableCell} whitespace-nowrap`}>
                      <ProgressLink href={`/releases/${a.release.id}`} className="text-brand-600 dark:text-brand-400 hover:underline text-xs">
                        {a.release.releaseCode}
                      </ProgressLink>
                    </td>
                    )}
                    {isColumnVisible("releaseName") && <td className={`${tableCell} whitespace-nowrap`}>{a.release.name}</td>}
                    {isColumnVisible("approvalType") && <td className={`${tableCell} whitespace-nowrap`}>{a.approvalType}</td>}
                    {isColumnVisible("approverId") && <td className={`${tableCell} whitespace-nowrap`}><span className="font-mono text-xs text-gray-500">{a.approver.userId}</span></td>}
                    {isColumnVisible("approverName") && <td className={`${tableCell} whitespace-nowrap`}>{a.approver.name}</td>}
                    {isColumnVisible("approverRole") && <td className={`${tableCell} whitespace-nowrap text-gray-600 text-xs`}>{a.approver.role}</td>}
                    {isColumnVisible("submittedDate") && <td className={`${tableCell} whitespace-nowrap text-gray-500`}>{formatDate(a.submittedDate)}</td>}
                    {isColumnVisible("decisionDate") && <td className={`${tableCell} whitespace-nowrap text-gray-500`}>{a.decisionDate ? formatDate(a.decisionDate) : "—"}</td>}
                    {isColumnVisible("decision") && (
                    <td className={`${tableCell} whitespace-nowrap`}>
                      <div className="flex items-center gap-1.5">
                        {DECISION_ICON[a.decision] ?? <Clock className="h-4 w-4 text-gray-400" />}
                        <span className="font-medium">{a.decision}</span>
                      </div>
                    </td>
                    )}
                    {isColumnVisible("comments") && <td className={`${tableCell} truncate max-w-[200px] whitespace-nowrap`} title={a.comments ?? ""}>{a.comments ?? "—"}</td>}
                    {isColumnVisible("cabMeetingId") && <td className={`${tableCell} whitespace-nowrap`}>{a.cabMeetingId ?? "—"}</td>}
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
