"use client";

import { Suspense } from "react";
import IncidentsContent from "./IncidentsContent";

export default function IncidentsPage() {
  return (
    <Suspense fallback={<p className="text-gray-500 p-6">Loading incidents…</p>}>
      <IncidentsContent />
    </Suspense>
  );
}
