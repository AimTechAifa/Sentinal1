"use client";

import { Suspense } from "react";
import LeaveCalendarContent from "./LeaveCalendarContent";

export default function LeavesPage() {
  return (
    <Suspense fallback={<p className="text-gray-500 p-6">Loading leave calendar…</p>}>
      <LeaveCalendarContent />
    </Suspense>
  );
}
