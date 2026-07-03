"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { MagicCard } from "@/components/ui/magic-card";
import type { LucideIcon } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  delay?: number;
  trend?: "up" | "down" | "neutral";
  className?: string;
}

export function MetricCard({ label, value, icon: Icon, delay = 0, trend, className }: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      <MagicCard
        gradient="from-brand-300/30 via-brand-200/20 to-brand-100/30"
        className="h-full group hover:shadow-theme-md transition-shadow"
      >
        <div className="p-5 md:p-6">
          <div className="flex items-start justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-50 ring-1 ring-brand-100 shadow-theme-sm group-hover:scale-105 transition-transform">
              <Icon className="h-6 w-6 text-brand-600" />
            </div>
            {trend && (
              <span
                className={cn(
                  "text-[10px] font-medium uppercase tracking-wide px-2 py-0.5 rounded-full",
                  trend === "up" && "bg-success-50 text-success-600",
                  trend === "down" && "bg-error-50 text-error-600",
                  trend === "neutral" && "bg-gray-100 text-gray-500"
                )}
              >
                {trend}
              </span>
            )}
          </div>
          <div className="mt-5">
            <span className="text-sm text-gray-500">{label}</span>
            <motion.h4
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: delay + 0.15 }}
              className="mt-2 text-title-sm font-bold text-gray-800 font-mono text-[10px] uppercase tracking-wider"
            >
              {value}
            </motion.h4>
          </div>
        </div>
      </MagicCard>
    </motion.div>
  );
}
