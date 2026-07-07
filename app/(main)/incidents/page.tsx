"use client";

import { Suspense } from "react";
import { TablePageSuspenseFallback } from "@/components/ui/TableSkeleton";
import IncidentsContent from "./IncidentsContent";

export default function IncidentsPage() {
  return (
    <Suspense fallback={<TablePageSuspenseFallback />}>
      <IncidentsContent />
    </Suspense>
  );
}
