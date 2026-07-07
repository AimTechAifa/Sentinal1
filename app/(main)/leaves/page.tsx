"use client";

import { Suspense } from "react";
import { TablePageSuspenseFallback } from "@/components/ui/TableSkeleton";
import LeaveCalendarContent from "./LeaveCalendarContent";

export default function LeavesPage() {
  return (
    <Suspense fallback={<TablePageSuspenseFallback />}>
      <LeaveCalendarContent />
    </Suspense>
  );
}
