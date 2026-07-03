import { statusTokens } from "@/lib/palette";
import { cn } from "@/lib/utils";

const fallback = statusTokens["N/A"];

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const token = statusTokens[status] ?? fallback;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-theme-xs font-medium",
        token.bg,
        token.text,
        className
      )}
    >
      {status}
    </span>
  );
}
