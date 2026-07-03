"use client";

import { cn } from "@/lib/utils";
import { BorderBeam } from "@/components/ui/border-beam";

interface MagicCardProps {
  children: React.ReactNode;
  className?: string;
  innerClassName?: string;
  gradient?: string;
  beam?: boolean;
  glow?: boolean;
}

/** Gradient-border card inspired by Magic UI / 21st.dev */
export function MagicCard({
  children,
  className,
  innerClassName,
  gradient = "from-brand-300/30 via-brand-200/20 to-brand-100/30",
  beam = false,
  glow = false,
}: MagicCardProps) {
  return (
    <div
      className={cn(
        "relative rounded-xl p-px bg-gradient-to-br shadow-theme-sm transition-shadow hover:shadow-theme-md",
        gradient,
        glow && "shadow-[0_0_40px_-12px_rgba(59,91,219,0.35)] dark:shadow-none",
        className
      )}
    >
      {beam && <BorderBeam />}
      <div
        className={cn(
          "relative h-full overflow-hidden rounded-[11px] bg-white dark:bg-[var(--card)]",
          innerClassName
        )}
      >
        {children}
      </div>
    </div>
  );
}
