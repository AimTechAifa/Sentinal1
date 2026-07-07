"use client";

import { Suspense } from "react";
import { TablePageSuspenseFallback } from "@/components/ui/TableSkeleton";
import PlannedMaintenanceContent from "./PlannedMaintenanceContent";

export default function PlannedMaintenancePage() {
  return (
    <Suspense fallback={<TablePageSuspenseFallback />}>
      <PlannedMaintenanceContent />
    </Suspense>
  );
}
