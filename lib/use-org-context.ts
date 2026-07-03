"use client";

import { useMemo } from "react";
import { useReleaseStore } from "@/context/ReleaseStoreContext";
import { buildLiveOrgContext } from "@/lib/release-store";

export function useOrgContext() {
  const { state } = useReleaseStore();
  return useMemo(() => buildLiveOrgContext(state), [state]);
}
