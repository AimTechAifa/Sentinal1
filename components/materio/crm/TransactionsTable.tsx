"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

export type TransactionRow = {
  id: string;
  primary: string;
  secondary?: string;
  meta?: string;
  amount?: string;
  status: string;
  href?: string;
};

type TransactionsTableProps = {
  rows: TransactionRow[];
  title?: string;
  subheader?: string;
  columns?: { primary: string; secondary?: string; meta?: string; amount?: string; status: string };
  emptyMessage?: string;
};

const defaultColumns = {
  primary: "Item",
  secondary: "Detail",
  meta: "Context",
  amount: "Value",
  status: "Status",
};

function getStatusChipStyles(status: string) {
  const s = status.toLowerCase();
  if (s.includes("go") || s.includes("ready") || s.includes("approved") || s.includes("open")) 
    return "border-success-200 text-success-700 bg-success-50/50";
  if (s.includes("risk") || s.includes("pending") || s.includes("progress")) 
    return "border-warning-200 text-warning-700 bg-warning-50/50";
  if (s.includes("block") || s.includes("fail") || s.includes("p1")) 
    return "border-error-200 text-error-700 bg-error-50/50";
  return "border-gray-200 text-gray-700 bg-gray-50/50";
}

export function TransactionsTable({
  rows,
  title = "Recent Transactions",
  subheader = "Releases and issues requiring attention",
  columns = defaultColumns,
  emptyMessage = "No items in this period.",
}: TransactionsTableProps) {
  return (
    <div className="flex h-full flex-col rounded-xl border border-[var(--border)] bg-white shadow-level-1">
      <div className="border-b border-[var(--border)] p-5">
        <h3 className="text-headline-sm text-gray-900">{title}</h3>
        {subheader && <p className="mt-0.5 text-sm text-gray-500">{subheader}</p>}
      </div>
      
      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-50/50 text-xs font-semibold uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-5 py-3 font-medium">{columns.primary}</th>
              {columns.secondary && <th className="px-5 py-3 font-medium">{columns.secondary}</th>}
              {columns.meta && <th className="px-5 py-3 font-medium">{columns.meta}</th>}
              {columns.amount && <th className="px-5 py-3 font-medium text-right">{columns.amount}</th>}
              <th className="px-5 py-3 font-medium text-right">{columns.status}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-gray-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="transition-colors hover:bg-gray-50/50">
                  <td className="px-5 py-3.5 align-middle">
                    {row.href ? (
                      <Link href={row.href} className="font-semibold text-brand-600 hover:text-brand-700">
                        {row.primary}
                      </Link>
                    ) : (
                      <span className="font-medium text-gray-900">{row.primary}</span>
                    )}
                  </td>
                  {columns.secondary && (
                    <td className="px-5 py-3.5 align-middle text-gray-500">{row.secondary ?? "—"}</td>
                  )}
                  {columns.meta && (
                    <td className="px-5 py-3.5 align-middle text-gray-500">{row.meta ?? "—"}</td>
                  )}
                  {columns.amount && (
                    <td className="px-5 py-3.5 align-middle text-right font-semibold text-gray-700">{row.amount ?? "—"}</td>
                  )}
                  <td className="px-5 py-3.5 align-middle text-right">
                    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium", getStatusChipStyles(row.status))}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {rows.length > 0 && (
        <div className="border-t border-[var(--border)] bg-gray-50/50 px-5 py-3">
          <p className="text-xs text-gray-500">
            Showing {rows.length} item{rows.length === 1 ? "" : "s"}
          </p>
        </div>
      )}
    </div>
  );
}
