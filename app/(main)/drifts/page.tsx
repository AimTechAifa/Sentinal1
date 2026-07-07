"use client";

import { Suspense } from "react";
import { TablePageSuspenseFallback } from "@/components/ui/TableSkeleton";
import DriftDashboardContent from "./DriftDashboardContent";

export default function DriftsPage() {
  return (
    <Suspense fallback={<TablePageSuspenseFallback />}>
      <DriftDashboardContent />
    </Suspense>
  );
}
