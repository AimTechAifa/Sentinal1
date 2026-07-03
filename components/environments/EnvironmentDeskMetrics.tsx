"use client";

import { motion } from "framer-motion";
import { AlertTriangle, CalendarCheck, GitBranch, Layers, Server, Snowflake } from "lucide-react";
import { MetricCard } from "@/components/ui/metric-card";
import type { EnvironmentDeskStats } from "@/lib/types";

export function EnvironmentDeskMetrics({ stats }: { stats: EnvironmentDeskStats }) {
  const metrics = [
    { label: "Timeline windows", value: stats.timelineCount, icon: CalendarCheck, trend: "neutral" as const },
    { label: "Env slots booked", value: stats.bookedEnvs, icon: Server, trend: stats.bookedEnvs > 4 ? ("up" as const) : ("neutral" as const) },
    { label: "Booking conflicts", value: stats.bookingConflicts, icon: GitBranch, trend: stats.bookingConflicts > 0 ? ("down" as const) : ("up" as const) },
    { label: "Version drift", value: stats.versionDrift, icon: Layers, trend: stats.versionDrift > 0 ? ("down" as const) : ("up" as const) },
    { label: "In freeze window", value: stats.releasesInFreeze, icon: Snowflake, trend: stats.releasesInFreeze > 0 ? ("down" as const) : ("up" as const) },
    { label: "Unhealthy nodes", value: stats.unhealthyServices, icon: AlertTriangle, trend: stats.unhealthyServices > 0 ? ("down" as const) : ("up" as const) },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4"
    >
      {metrics.map(({ label, value, icon, trend }, i) => (
        <MetricCard key={label} label={label} value={value} icon={icon} trend={trend} delay={i * 0.05} />
      ))}
    </motion.div>
  );
}
