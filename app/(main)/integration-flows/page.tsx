"use client";

import { Suspense } from "react";
import { TablePageSuspenseFallback } from "@/components/ui/TableSkeleton";
import IntegrationFlowsContent from "./IntegrationFlowsContent";

export default function IntegrationFlowsPage() {
  return (
    <Suspense fallback={<TablePageSuspenseFallback />}>
      <IntegrationFlowsContent />
    </Suspense>
  );
}
