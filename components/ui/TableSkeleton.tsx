import { cn } from "@/lib/utils";

type TableSkeletonProps = {
  rows?: number;
  columns?: number;
  showFilterBar?: boolean;
  showTitle?: boolean;
  className?: string;
};

export function TableSkeleton({
  rows = 8,
  columns = 6,
  showFilterBar = true,
  showTitle = true,
  className,
}: TableSkeletonProps) {
  return (
    <div className={cn("animate-pulse space-y-4", className)} aria-label="Loading table" role="status">
      {showFilterBar && (
        <div className="flex flex-wrap items-center gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-9 w-28 rounded-lg bg-slate-200 dark:bg-slate-700" />
          ))}
          <div className="ml-auto h-9 w-24 rounded-lg bg-slate-100 dark:bg-slate-800" />
        </div>
      )}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-[var(--card)]">
        {showTitle && (
          <div className="flex items-center gap-3 border-b border-gray-200 px-6 py-5 dark:border-gray-700">
            <div className="h-10 w-10 shrink-0 rounded-xl bg-slate-200 dark:bg-slate-700" />
            <div className="space-y-2">
              <div className="h-4 w-32 rounded bg-slate-200 dark:bg-slate-700" />
              <div className="h-3 w-48 rounded bg-slate-100 dark:bg-slate-800" />
            </div>
          </div>
        )}
        <div className="border-b border-gray-100 px-6 py-3 dark:border-gray-800">
          <div className="flex gap-6">
            {Array.from({ length: columns }).map((_, i) => (
              <div key={i} className="h-3 w-16 rounded bg-slate-200 dark:bg-slate-700" />
            ))}
          </div>
        </div>
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            className="flex gap-6 border-b border-gray-50 px-6 py-4 last:border-0 dark:border-gray-800/80"
          >
            {Array.from({ length: columns }).map((_, colIndex) => (
              <div
                key={colIndex}
                className="h-4 max-w-[120px] flex-1 rounded bg-slate-100 dark:bg-slate-800"
                style={{ maxWidth: colIndex === 0 ? 80 : 120 }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function TablePageSuspenseFallback({ columns = 6 }: { columns?: number }) {
  return (
    <div className="space-y-6">
      <div className="animate-pulse space-y-2">
        <div className="h-7 w-48 rounded-lg bg-slate-200 dark:bg-slate-700" />
        <div className="h-4 w-64 rounded bg-slate-100 dark:bg-slate-800" />
      </div>
      <TableSkeleton showFilterBar showTitle columns={columns} />
    </div>
  );
}
