"use client";

import { Suspense } from "react";
import { TablePageSuspenseFallback } from "@/components/ui/TableSkeleton";
import MonitoringAlertsContent from "./MonitoringAlertsContent";

export default function MonitoringAlertsPage() {
  return (
    <Suspense fallback={<TablePageSuspenseFallback />}>
      <MonitoringAlertsContent />
    </Suspense>
  );
}
