"use client";

import { useEffect, useState, use } from "react";
import { DbReleaseDetail } from "@/components/releases/DbReleaseDetail";
import { isSyntheticReleaseId, SyntheticReleaseDetail } from "@/components/releases/SyntheticReleaseDetail";
import { safeFetchJson } from "@/lib/safe-fetch";

export default function ReleaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [mode, setMode] = useState<"loading" | "db" | "synthetic" | "missing">("loading");

  useEffect(() => {
    if (isSyntheticReleaseId(id)) {
      setMode("synthetic");
      return;
    }
    const ac = new AbortController();
    void (async () => {
      const result = await safeFetchJson(`/api/releases/${id}`, {
        signal: ac.signal,
        label: "release-detail-mode",
        rejectHttpErrors: false,
      });
      if (ac.signal.aborted) return;
      setMode(result.ok && result.status >= 200 && result.status < 300 ? "db" : "missing");
    })();
    return () => ac.abort();
  }, [id]);

  if (mode === "loading") return <p className="text-gray-500">Loading release…</p>;
  if (mode === "missing") return <p className="text-gray-500">Release not found.</p>;
  if (mode === "synthetic") return <SyntheticReleaseDetail id={id} />;
  return <DbReleaseDetail id={id} />;
}
