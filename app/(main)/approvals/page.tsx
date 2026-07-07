"use client";

import { Suspense } from "react";
import { TablePageSuspenseFallback } from "@/components/ui/TableSkeleton";
import ApprovalQueueContent from "./ApprovalQueueContent";

export default function ApprovalsPage() {
  return (
    <Suspense fallback={<TablePageSuspenseFallback />}>
      <ApprovalQueueContent />
    </Suspense>
  );
}
