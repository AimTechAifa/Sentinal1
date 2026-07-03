"use client";

import { useTheme } from "@mui/material/styles";
import type { LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export type CrmStatCardProps = {
  title: string;
  value: string | number;
  trendText?: string;
  trendDirection?: "up" | "down" | "neutral";
  icon: LucideIcon;
  color?: "primary" | "success" | "warning" | "error" | "info" | "neutral";
};

const BORDER_MAP = {
  primary: "border-l-brand-600",
  success: "border-l-emerald-600",
  warning: "border-l-amber-700",
  error: "border-l-error-700",
  info: "border-l-blue-700",
  neutral: "border-l-gray-900",
};

const ICON_COLOR_MAP = {
  primary: "text-brand-600 dark:text-brand-400",
  success: "text-emerald-600 dark:text-emerald-400",
  warning: "text-amber-700 dark:text-amber-400",
  error: "text-error-700 dark:text-error-400",
  info: "text-blue-700 dark:text-blue-400",
  neutral: "text-gray-900 dark:text-white",
};

const TREND_MAP = {
  up: "text-emerald-600",
  down: "text-emerald-600", // In screenshot, "down" for blocked is green because less blocked is good! Wait, if it's dynamic... let's just use emerald for down since it's a reduction in blocked.
  neutral: "text-gray-600",
};

export function CrmStatCard({ title, value, trendText, trendDirection = "neutral", icon: Icon, color = "primary" }: CrmStatCardProps) {
  return (
    <div className={cn(
      "flex flex-col justify-between rounded-xl border border-gray-200 dark:border-[var(--border)] border-l-[4px] bg-white dark:bg-[var(--card)] p-5 shadow-sm transition-shadow hover:shadow-md h-full min-h-[140px]", 
      BORDER_MAP[color] || BORDER_MAP.primary
    )}>
      <div className="flex items-start justify-between w-full">
        <span className="text-[10px] font-bold tracking-widest text-gray-500 dark:text-white/65 uppercase">{title}</span>
        <Icon className={cn("h-[18px] w-[18px]", ICON_COLOR_MAP[color] || ICON_COLOR_MAP.primary)} strokeWidth={2} />
      </div>
      
      <div className="mt-4">
        <h4 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">{value}</h4>
        
        {trendText && (
          <div className={cn(
            "flex items-center gap-1.5 mt-2.5 text-[11px] font-bold tracking-wide", 
            trendDirection === "up" ? (color === "warning" ? "text-error-600" : "text-emerald-600") : 
            trendDirection === "down" ? "text-emerald-600 dark:text-emerald-400" : "text-gray-500 dark:text-white/65"
          )}>
            {trendDirection === "up" && <TrendingUp className="w-3.5 h-3.5" strokeWidth={3} />}
            {trendDirection === "down" && <TrendingDown className="w-3.5 h-3.5" strokeWidth={3} />}
            {trendDirection === "neutral" && <Minus className="w-3.5 h-3.5" strokeWidth={3} />}
            <span>{trendText}</span>
          </div>
        )}
      </div>
    </div>
  );
}
