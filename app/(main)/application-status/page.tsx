"use client";

import { Suspense } from "react";
import ApplicationStatusContent from "./ApplicationStatusContent";

export default function ApplicationStatusPage() {
  return (
    <Suspense fallback={<p className="text-gray-500 p-6">Loading application status…</p>}>
      <ApplicationStatusContent />
    </Suspense>
  );
}
