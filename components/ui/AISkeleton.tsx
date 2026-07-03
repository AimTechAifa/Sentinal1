import { cn } from "@/lib/utils";

export function AISkeleton({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-4 shimmer rounded" style={{ width: `${85 - i * 15}%` }} />
      ))}
    </div>
  );
}

export function AICardSkeleton() {
  return (
    <div className="ai-card p-5 space-y-3">
      <div className="h-5 w-32 shimmer rounded" />
      <AISkeleton lines={4} />
    </div>
  );
}
