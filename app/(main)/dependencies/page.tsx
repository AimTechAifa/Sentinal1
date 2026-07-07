"use client";

import { Suspense } from "react";
import { TablePageSuspenseFallback } from "@/components/ui/TableSkeleton";
import DependencyListContent from "./DependencyListContent";

export default function DependenciesPage() {
  return (
    <Suspense fallback={<TablePageSuspenseFallback />}>
      <DependencyListContent />
    </Suspense>
  );
}
