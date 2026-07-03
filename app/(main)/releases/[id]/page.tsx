"use client";

import { useEffect, useState, use } from "react";
import { DbReleaseDetail } from "@/components/releases/DbReleaseDetail";
import { isSyntheticReleaseId, SyntheticReleaseDetail } from "@/components/releases/SyntheticReleaseDetail";

export default function ReleaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [mode, setMode] = useState<"loading" | "db" | "synthetic" | "missing">("loading");

  useEffect(() => {
    if (isSyntheticReleaseId(id)) {
      setMode("synthetic");
      return;
    }
    fetch(`/api/releases/${id}`)
      .then((r) => setMode(r.ok ? "db" : "missing"))
      .catch(() => setMode("missing"));
  }, [id]);

  if (mode === "loading") return <p className="text-gray-500">Loading release…</p>;
  if (mode === "missing") return <p className="text-gray-500">Release not found.</p>;
  if (mode === "synthetic") return <SyntheticReleaseDetail id={id} />;
  return <DbReleaseDetail id={id} />;
}
