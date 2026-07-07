"use client";

import { Suspense } from "react";
import { TablePageSuspenseFallback } from "@/components/ui/TableSkeleton";
import { ReferenceDataManager } from "@/components/admin/ReferenceDataManager";

export default function AdminReferenceDataPage() {
  return (
    <Suspense fallback={<TablePageSuspenseFallback />}>
      <ReferenceDataManager />
    </Suspense>
  );
}
