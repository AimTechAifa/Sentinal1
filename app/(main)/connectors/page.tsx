"use client";

import { Suspense } from "react";
import { TablePageSuspenseFallback } from "@/components/ui/TableSkeleton";
import ConnectorsPageContent from "./ConnectorsPageContent";

export default function ConnectorsPage() {
  return (
    <Suspense fallback={<TablePageSuspenseFallback />}>
      <ConnectorsPageContent />
    </Suspense>
  );
}
