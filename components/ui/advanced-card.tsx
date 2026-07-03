"use client";

import { cn } from "@/lib/utils";
import { MagicCard } from "@/components/ui/magic-card";
import type { LucideIcon } from "lucide-react";

type Variant = "default" | "ai" | "glass" | "plain";

const GRADIENTS: Record<Exclude<Variant, "plain">, string> = {
  default: "from-gray-200/80 via-white to-gray-200/80",
  ai: "from-brand-300/30 via-brand-200/20 to-brand-100/30",
  glass: "from-brand-100/30 via-white to-brand-50/40",
};

interface AdvancedCardProps {
  children: React.ReactNode;
  className?: string;
  innerClassName?: string;
  title?: string;
  subtitle?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  variant?: Variant;
  beam?: boolean;
  glow?: boolean;
  noPadding?: boolean;
}

export function AdvancedCard({
  children,
  className,
  innerClassName,
  title,
  subtitle,
  icon: Icon,
  action,
  variant = "default",
  beam = false,
  glow,
  noPadding = false,
}: AdvancedCardProps) {
  const header = (title || Icon || action) && (
    <div className={cn("flex items-start justify-between gap-3", !noPadding && "mb-4")}>
      <div className="flex items-start gap-2.5 min-w-0">
        {Icon && (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-500/15">
            <Icon className="h-4 w-4 text-brand-500 dark:text-brand-400" />
          </div>
        )}
        <div className="min-w-0">
          {title && <h3 className="text-headline-sm text-gray-900 dark:text-white truncate">{title}</h3>}
          {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );

  if (variant === "plain") {
    return (
      <div className={cn("ta-card", className, innerClassName)}>
        {header}
        {children}
      </div>
    );
  }

  return (
    <MagicCard
      gradient={GRADIENTS[variant]}
      beam={beam || variant === "ai"}
      glow={glow ?? variant === "ai"}
      className={className}
      innerClassName={cn(!noPadding && "p-5 md:p-6", innerClassName)}
    >
      {header}
      {children}
    </MagicCard>
  );
}
