"use client";

import { palette } from "@/lib/palette";
import { cn } from "@/lib/utils";

interface BorderBeamProps {
  className?: string;
  size?: number;
  duration?: number;
  colorFrom?: string;
  colorTo?: string;
}

/** Animated border beam (Magic UI pattern) */
export function BorderBeam({
  className,
  size = 200,
  duration = 8,
  colorFrom = palette.accent[500],
  colorTo = palette.brand[500],
}: BorderBeamProps) {
  return (
    <div
      className={cn("pointer-events-none absolute inset-0 rounded-[inherit] overflow-hidden", className)}
      style={
        {
          "--size": `${size}px`,
          "--duration": `${duration}s`,
          "--color-from": colorFrom,
          "--color-to": colorTo,
        } as React.CSSProperties
      }
    >
      <div className="absolute inset-0 rounded-[inherit] border-beam-spin opacity-80" />
    </div>
  );
}
