"use client";

import { useCallback, useEffect, useState } from "react";
import { EnvironmentDetailsTable } from "@/components/environments/EnvironmentDetailsTable";
import type { ApplicationVersionRow } from "@/lib/types";
import type { SessionUser } from "@/lib/auth/roles";

type DeskPayload = {
  versionMatrix: ApplicationVersionRow[];
  versions: any[];
};

export default function EnvironmentsPage() {
  const [desk, setDesk] = useState<DeskPayload | null>(null);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [selectedApp, setSelectedApp] = useState<string | null>(null);

  const loadDesk = useCallback(() => {
    fetch("/api/environment-desk").then((r) => r.json()).then(setDesk);
  }, []);

  useEffect(() => {
    loadDesk();
    fetch("/api/auth/me").then((r) => r.json()).then((d) => setUser(d.user));
  }, [loadDesk]);

  if (!desk) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8 bg-gray-50 text-gray-500">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-8 w-8 rounded-full border-4 border-brand-500 border-t-transparent animate-spin" />
          <p>Loading environments...</p>
        </div>
      </div>
    );
  }

  const canPromote = user?.role === "admin" || user?.role === "editor";
  const promote = (releaseId: string) => window.open(`/releases/${releaseId}`, "_blank");

  return (
    <div className="space-y-6 min-w-0">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-2">Environments</h1>
        <p className="text-gray-500 text-sm">
          Track version deployments, identify drifts, and review detailed configuration across all environments.
        </p>
      </div>

      <div className="grid gap-6 min-w-0">
        <EnvironmentDetailsTable 
          versions={desk.versions} 
          selectedApp={selectedApp} 
          onSelectApp={setSelectedApp} 
        />
      </div>
    </div>
  );
}
