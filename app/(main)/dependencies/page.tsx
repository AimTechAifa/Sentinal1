"use client";

import { Suspense } from "react";
import DependencyListContent from "./DependencyListContent";

export default function DependenciesPage() {
  return (
    <Suspense fallback={<p className="text-gray-500 p-6">Loading dependencies…</p>}>
      <DependencyListContent />
    </Suspense>
  );
}
