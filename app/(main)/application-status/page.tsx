"use client";

import { Suspense } from "react";
import { TablePageSuspenseFallback } from "@/components/ui/TableSkeleton";
import ApplicationStatusContent from "./ApplicationStatusContent";

export default function ApplicationStatusPage() {
  return (
    <Suspense fallback={<TablePageSuspenseFallback />}>
      <ApplicationStatusContent />
    </Suspense>
  );
}
