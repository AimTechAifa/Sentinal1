"use client";

import { Suspense } from "react";
import RiskRegisterContent from "./RiskRegisterContent";

export default function RisksPage() {
  return (
    <Suspense fallback={<p className="text-gray-500 p-6">Loading risk register…</p>}>
      <RiskRegisterContent />
    </Suspense>
  );
}
