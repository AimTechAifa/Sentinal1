import { readinessColor, readinessTier, readinessTokens } from "@/lib/palette";
import { cn } from "@/lib/utils";

export function ReadinessBadge({
  value,
  blockerCount,
  compact = false,
  className,
}: {
  value: number;
  blockerCount?: number;
  compact?: boolean;
  className?: string;
}) {
  const tier = readinessTier(value);
  const token = readinessTokens[tier];
  const barColor = readinessColor(value);

  return (
    <div className={cn("flex flex-col gap-1 min-w-[72px]", className)}>
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2 py-0.5 text-theme-xs font-semibold font-mono text-[10px] uppercase tracking-wider",
            token.bg,
            token.text
          )}
        >
          {value}%
        </span>
        {!compact && blockerCount !== undefined && blockerCount > 0 && (
          <span className="text-[10px] text-warning-600 font-medium">{blockerCount} blk</span>
        )}
      </div>
      <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${Math.max(0, Math.min(100, value))}%`, backgroundColor: barColor }}
        />
      </div>
    </div>
  );
}
