"use client";

import { Suspense } from "react";
import CommandDashboardContent from "./CommandDashboardContent";

export default function DashboardPage() {
  return (
    <Suspense fallback={<p className="text-gray-500 p-6">Loading dashboard…</p>}>
      <CommandDashboardContent />
    </Suspense>
  );
}
