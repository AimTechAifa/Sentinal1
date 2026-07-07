"use client";

import { Suspense } from "react";
import { TablePageSuspenseFallback } from "@/components/ui/TableSkeleton";
import CommandDashboardContent from "./CommandDashboardContent";

export default function DashboardPage() {
  return (
    <Suspense fallback={<TablePageSuspenseFallback />}>
      <CommandDashboardContent />
    </Suspense>
  );
}
