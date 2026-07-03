"use client";

import { Suspense } from "react";
import ConflictQueueContent from "./ConflictQueueContent";

export default function ConflictsPage() {
  return (
    <Suspense fallback={<p className="text-gray-500 p-6">Loading conflicts…</p>}>
      <ConflictQueueContent />
    </Suspense>
  );
}
