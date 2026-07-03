"use client";

import { cn } from "@/lib/utils";

interface TopBarProps {
  title: string;
  subtitle?: string;
  positioning?: string;
  highlight?: boolean;
  badge?: React.ReactNode;
  className?: string;
}

export function TopBar({ title, subtitle, positioning, highlight = false, badge, className }: TopBarProps) {
  return (
    <header className={cn("relative mb-4 md:mb-5", className)}>
      <div className="relative flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm font-medium text-gray-500 dark:text-gray-400">{subtitle}</p>}
          {positioning && <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{positioning}</p>}
        </div>
        {badge}
      </div>
    </header>
  );
}
