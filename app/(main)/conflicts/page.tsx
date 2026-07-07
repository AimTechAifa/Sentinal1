"use client";

import { Suspense } from "react";
import { TablePageSuspenseFallback } from "@/components/ui/TableSkeleton";
import ConflictQueueContent from "./ConflictQueueContent";

export default function ConflictsPage() {
  return (
    <Suspense fallback={<TablePageSuspenseFallback />}>
      <ConflictQueueContent />
    </Suspense>
  );
}
