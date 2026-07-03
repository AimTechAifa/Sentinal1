"use client";

import { Suspense } from "react";
import ConnectorsPageContent from "./ConnectorsPageContent";

export default function ConnectorsPage() {
  return (
    <Suspense fallback={<p className="text-gray-500 p-6">Loading connectors…</p>}>
      <ConnectorsPageContent />
    </Suspense>
  );
}
