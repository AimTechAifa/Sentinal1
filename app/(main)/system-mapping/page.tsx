"use client";

import { Suspense } from "react";
import { TablePageSuspenseFallback } from "@/components/ui/TableSkeleton";
import { SystemMappingContent } from "./SystemMappingContent";

export default function SystemMappingPage() {
  return (
    <Suspense fallback={<TablePageSuspenseFallback />}>
      <SystemMappingContent />
    </Suspense>
  );
}
