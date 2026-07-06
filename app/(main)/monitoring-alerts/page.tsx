"use client";

import { Suspense } from "react";
import MonitoringAlertsContent from "./MonitoringAlertsContent";

export default function MonitoringAlertsPage() {
  return (
    <Suspense fallback={<p className="text-gray-500 p-6">Loading monitoring alerts…</p>}>
      <MonitoringAlertsContent />
    </Suspense>
  );
}
