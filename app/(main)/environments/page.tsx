"use client";

import { Suspense } from "react";
import { TablePageSuspenseFallback } from "@/components/ui/TableSkeleton";
import { EnvironmentsContent } from "./EnvironmentsContent";

export default function EnvironmentsPage() {
  return (
    <Suspense fallback={<TablePageSuspenseFallback />}>
      <EnvironmentsContent />
    </Suspense>
  );
}
