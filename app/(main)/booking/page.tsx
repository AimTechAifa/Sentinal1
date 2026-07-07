"use client";

import { Suspense } from "react";
import { TablePageSuspenseFallback } from "@/components/ui/TableSkeleton";
import BookingContent from "./BookingContent";

export default function BookingPage() {
  return (
    <Suspense fallback={<TablePageSuspenseFallback />}>
      <BookingContent />
    </Suspense>
  );
}
