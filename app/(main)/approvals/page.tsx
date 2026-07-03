"use client";

import { Suspense } from "react";
import ApprovalQueueContent from "./ApprovalQueueContent";

export default function ApprovalsPage() {
  return (
    <Suspense fallback={<p className="text-gray-500 p-6">Loading approval queue…</p>}>
      <ApprovalQueueContent />
    </Suspense>
  );
}
