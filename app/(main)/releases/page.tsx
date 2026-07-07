"use client";

import { Suspense } from "react";
import { TablePageSuspenseFallback } from "@/components/ui/TableSkeleton";
import ReleasesPageContent from "./ReleasesPageContent";

export default function ReleasesPage() {
  return (
    <Suspense fallback={<TablePageSuspenseFallback />}>
      <ReleasesPageContent />
    </Suspense>
  );
}
