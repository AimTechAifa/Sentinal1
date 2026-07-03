"use client";

import { motion } from "framer-motion";
import { AlertTriangle, ArrowRight, Info } from "lucide-react";
import { ProgressLink } from "@/components/layout/NavigationProgress";
import { AdvancedCard } from "@/components/ui/advanced-card";
import type { EnvironmentDeskAlert } from "@/lib/types";
import { cn } from "@/lib/utils";

const severityStyles = {
  high: "border-error-200 bg-error-50/80 text-error-800",
  medium: "border-warning-200 bg-warning-50/80 text-warning-900",
  low: "border-brand-200 bg-brand-50/60 text-brand-800",
};

const severityIcon = {
  high: AlertTriangle,
  medium: AlertTriangle,
  low: Info,
};

export function EnvironmentDeskAlerts({ alerts }: { alerts: EnvironmentDeskAlert[] }) {
  if (alerts.length === 0) return null;

  return (
    <AdvancedCard
      title="Action Required"
      subtitle={`${alerts.length} item${alerts.length === 1 ? "" : "s"} need release manager attention`}
      icon={AlertTriangle}
      variant="ai"
      beam
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {alerts.slice(0, 6).map((alert, i) => {
          const Icon = severityIcon[alert.severity];
          return (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={cn("rounded-xl border p-4 flex flex-col gap-2", severityStyles[alert.severity])}
            >
              <div className="flex items-start gap-2">
                <Icon className="h-4 w-4 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm">{alert.title}</p>
                  <p className="text-xs opacity-80 mt-0.5">{alert.detail}</p>
                </div>
              </div>
              {alert.href && alert.actionLabel && (
                <ProgressLink
                  href={alert.href}
                  className="inline-flex items-center gap-1 text-xs font-medium self-start hover:underline"
                >
                  {alert.actionLabel} <ArrowRight className="h-3 w-3" />
                </ProgressLink>
              )}
            </motion.div>
          );
        })}
      </div>
    </AdvancedCard>
  );
}
