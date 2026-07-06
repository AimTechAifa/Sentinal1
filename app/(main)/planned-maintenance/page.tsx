"use client";

import { Suspense } from "react";
import PlannedMaintenanceContent from "./PlannedMaintenanceContent";

export default function PlannedMaintenancePage() {
  return (
    <Suspense fallback={<p className="text-gray-500 p-6">Loading planned maintenance…</p>}>
      <PlannedMaintenanceContent />
    </Suspense>
  );
}
