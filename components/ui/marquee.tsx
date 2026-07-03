"use client";

import { cn } from "@/lib/utils";

interface MarqueeProps {
  children: React.ReactNode;
  className?: string;
  reverse?: boolean;
  pauseOnHover?: boolean;
}

export function Marquee({ children, className, reverse, pauseOnHover }: MarqueeProps) {
  return (
    <div
      className={cn(
        "group flex overflow-hidden [--gap:1rem] [gap:var(--gap)]",
        pauseOnHover && "[&:hover_.marquee-track]:paused",
        className
      )}
    >
      <div
        className={cn(
          "marquee-track flex shrink-0 min-w-full items-center justify-around [gap:var(--gap)] animate-marquee",
          reverse && "[animation-direction:reverse]"
        )}
      >
        {children}
      </div>
      <div
        className={cn(
          "marquee-track flex shrink-0 min-w-full items-center justify-around [gap:var(--gap)] animate-marquee",
          reverse && "[animation-direction:reverse]"
        )}
        aria-hidden
      >
        {children}
      </div>
    </div>
  );
}
