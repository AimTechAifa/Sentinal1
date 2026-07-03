"use client";

import { Suspense } from "react";
import ReleasesPageContent from "./ReleasesPageContent";

export default function ReleasesPage() {
  return (
    <Suspense fallback={<p className="text-gray-500 p-6">Loading releases…</p>}>
      <ReleasesPageContent />
    </Suspense>
  );
}
