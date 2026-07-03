"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import type { QuickStartSeedId } from "@/lib/release-store";
import { useReleaseStore } from "@/context/ReleaseStoreContext";

export function useQuickStartLauncher() {
  const router = useRouter();
  const { applySeed } = useReleaseStore();

  return useCallback(
    (href: string, seed?: QuickStartSeedId) => {
      if (seed) {
        applySeed(seed);
      }
      router.push(href);
    },
    [applySeed, router]
  );
}
