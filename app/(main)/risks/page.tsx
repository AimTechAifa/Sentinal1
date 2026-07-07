"use client";

import { Suspense } from "react";
import { TablePageSuspenseFallback } from "@/components/ui/TableSkeleton";
import RiskRegisterContent from "./RiskRegisterContent";

export default function RisksPage() {
  return (
    <Suspense fallback={<TablePageSuspenseFallback />}>
      <RiskRegisterContent />
    </Suspense>
  );
}
