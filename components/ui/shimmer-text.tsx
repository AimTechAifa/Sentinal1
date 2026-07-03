import { cn } from "@/lib/utils";

interface ShimmerTextProps {
  children: React.ReactNode;
  className?: string;
}

/** Magic UI–style animated gradient text */
export function ShimmerText({ children, className }: ShimmerTextProps) {
  return (
    <span
      className={cn(
        "inline-block bg-gradient-to-r from-brand-600 via-brand-500 to-brand-600 bg-[length:200%_auto] bg-clip-text text-transparent animate-text-shimmer",
        className
      )}
    >
      {children}
    </span>
  );
}
