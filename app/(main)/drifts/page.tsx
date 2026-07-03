"use client";

import { Suspense } from "react";
import DriftDashboardContent from "./DriftDashboardContent";

export default function DriftsPage() {
  return (
    <Suspense fallback={<p className="text-gray-500 p-6">Loading drift dashboard…</p>}>
      <DriftDashboardContent />
    </Suspense>
  );
}
