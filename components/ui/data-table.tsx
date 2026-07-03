"use client";

import { MagicCard } from "@/components/ui/magic-card";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface DataTableProps {
  title?: string;
  subtitle?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function DataTable({ title, subtitle, icon: Icon, action, children, className }: DataTableProps) {
  return (
    <MagicCard
      gradient="from-gray-200/70 via-white to-gray-200/70"
      className={cn("w-full max-w-full overflow-hidden", className)}
      innerClassName="overflow-hidden"
    >
      {(title || Icon) && (
        <div className="flex items-center justify-between gap-3 border-b border-gray-200 dark:border-[var(--border)] px-6 py-5 bg-white dark:bg-[var(--card)]">
          <div className="flex items-center gap-3 min-w-0">
            {Icon && (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-500/10 shadow-sm border border-brand-100 dark:border-brand-500/20">
                <Icon className="h-5 w-5 text-brand-600 dark:text-brand-400" />
              </div>
            )}
            <div>
              {title && <h3 className="text-headline-sm font-bold text-gray-900 dark:text-white">{title}</h3>}
              {subtitle && <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>}
            </div>
          </div>
          {action}
        </div>
      )}
      <div className="overflow-x-auto">{children}</div>
    </MagicCard>
  );
}

export const tableHeadRow = "bg-gray-50 dark:bg-gray-800/50 text-label-md uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-[var(--border)]";
export const tableRow = "border-b border-gray-200 dark:border-[var(--border)] hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-200 group";
export const tableCell = "p-4 align-middle transition-colors text-gray-800 dark:text-gray-200";
