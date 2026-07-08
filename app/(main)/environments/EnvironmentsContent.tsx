"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { EnvironmentDetailsTable } from "@/components/environments/EnvironmentDetailsTable";
import { FilterSelect, TableFilterBar } from "@/components/filters/TableFilterBar";
import { ENVIRONMENT_COLUMNS, ENVIRONMENT_FILTER_FIELDS } from "@/lib/table-page-columns";
import { TableToolbar } from "@/components/ui/data-table";
import { useTableFilters } from "@/hooks/useTableFilters";
import { useTablePageLoading } from "@/hooks/useTablePageLoading";
import { useTablePagePreferences } from "@/hooks/useTablePagePreferences";
import { TableSkeleton } from "@/components/ui/TableSkeleton";
import { PageDocumentation } from "@/components/help/PageDocumentation";
import { ENVIRONMENTS_FILTER_SCHEMA } from "@/lib/table-filters";

type DeskPayload = {
  versionMatrix: unknown[];
  versions: Array<{ application?: { id?: string; name?: string } }>;
  applications?: Array<{ id: string; name: string }>;
};

export function EnvironmentsContent() {
  const { values, setFilter, clearAll, hasActive, apiQuery } = useTableFilters(ENVIRONMENTS_FILTER_SCHEMA);
  const [desk, setDesk] = useState<DeskPayload | null>(null);
  const [deskLoading, setDeskLoading] = useState(true);

  const loadDesk = useCallback(() => {
    setDeskLoading(true);
    fetch(`/api/environment-desk${apiQuery}`)
      .then((r) => r.json())
      .then(setDesk)
      .finally(() => setDeskLoading(false));
  }, [apiQuery]);

  useEffect(() => {
    loadDesk();
  }, [loadDesk]);

  const appOptions = useMemo(() => {
    if (!desk?.applications?.length) {
      const seen = new Map<string, string>();
      for (const v of desk?.versions ?? []) {
        const id = v.application?.id;
        const name = v.application?.name;
        if (id && name) seen.set(id, name);
      }
      return [...seen.entries()].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
    }
    return [...desk.applications].sort((a, b) => a.name.localeCompare(b.name));
  }, [desk]);

  const selectedAppName = useMemo(() => {
    if (!values.applicationId) return null;
    return appOptions.find((a) => a.id === values.applicationId)?.name ?? null;
  }, [appOptions, values.applicationId]);

  const { isColumnVisible, columnPicker, filterPicker, isFilterVisible, prefsLoaded } = useTablePagePreferences(
    "environments",
    ENVIRONMENT_COLUMNS,
    ENVIRONMENT_FILTER_FIELDS,
    { lockedKeys: ["application"] }
  );

  const tablePending = useTablePageLoading(deskLoading, prefsLoaded);

  if (tablePending) {
    return (
      <div className="space-y-6 min-w-0">
        <TableSkeleton columns={ENVIRONMENT_COLUMNS.length} rows={10} showFilterBar={false} />
      </div>
    );
  }

  if (!desk) {
    return null;
  }

  return (
    <div className="space-y-6 min-w-0">
      <div className="flex items-start justify-between gap-4">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-2">Environments</h1>
          <p className="text-gray-500 text-sm">
            Track version deployments, identify drifts, and review detailed configuration across all environments.
          </p>
        </div>
        <PageDocumentation pageKey="environments" />
      </div>

      <TableFilterBar hasActive={hasActive} onClear={clearAll} manageFilters={filterPicker}>
        {isFilterVisible("applicationId") && (
          <FilterSelect
            value={values.applicationId}
            onChange={(v) => setFilter("applicationId", v)}
          >
            <option value="">All applications</option>
            {appOptions.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </FilterSelect>
        )}
      </TableFilterBar>

      <div className="grid gap-6 min-w-0">
        <EnvironmentDetailsTable
          versions={desk.versions}
          selectedApp={selectedAppName}
          isColumnVisible={isColumnVisible}
          toolbar={<TableToolbar>{columnPicker}</TableToolbar>}
          onSelectApp={(name) => {
            const match = appOptions.find((a) => a.name === name);
            setFilter("applicationId", match?.id ?? "");
          }}
        />
      </div>
    </div>
  );
}
