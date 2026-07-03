"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import {
  DEFAULT_PAGE_SIZE,
  filterRows,
  pageCount,
  paginateRows,
  sortRows,
  type SortDir,
} from "@/lib/master-data/table-utils";
import {
  apiJson,
  BrowseToolbar,
  FormField,
  FormModal,
  inputClass,
  MasterDataEmptyState,
  MasterDataError,
  MasterDataLoading,
  MasterDataTableShell,
  RowActionsMenu,
  SortableTh,
  StatusPill,
  tdClass,
  thClass,
} from "@/components/master-data/shared";

type DepartmentOption = { id: string; name: string };

type ApplicationRow = {
  id: string;
  name: string;
  type: string;
  criticality: string;
  productOwner: string;
  techLead: string;
  support: string;
  departmentId: string;
  department: { id: string; name: string };
  _count: { environments: number; releaseLinks: number; bookings: number };
};

type EnvironmentRow = {
  id: string;
  name: string;
  type: string;
  owner: string;
  status: string;
  applicationId: string;
};

type AppFormState = {
  name: string;
  departmentId: string;
  type: string;
  productOwner: string;
  techLead: string;
  support: string;
  criticality: string;
};

type EnvFormState = {
  name: string;
  type: string;
  owner: string;
  status: string;
};

const emptyAppForm: AppFormState = {
  name: "",
  departmentId: "",
  type: "",
  productOwner: "",
  techLead: "",
  support: "",
  criticality: "Medium",
};

const emptyEnvForm: EnvFormState = {
  name: "",
  type: "",
  owner: "",
  status: "Available",
};

type AppSortKey = "name" | "type" | "criticality" | "productOwner" | "techLead";

export function ApplicationsBrowse() {
  const [apps, setApps] = useState<ApplicationRow[]>([]);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<AppSortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [envSearch, setEnvSearch] = useState("");
  const [envPage, setEnvPage] = useState(1);

  const [managingApp, setManagingApp] = useState<ApplicationRow | null>(null);
  const [envs, setEnvs] = useState<EnvironmentRow[]>([]);
  const [envLoading, setEnvLoading] = useState(false);

  const [appModalOpen, setAppModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<ApplicationRow | null>(null);
  const [appForm, setAppForm] = useState<AppFormState>(emptyAppForm);
  const [appSubmitting, setAppSubmitting] = useState(false);
  const [appFormError, setAppFormError] = useState<string | null>(null);

  const [envModalOpen, setEnvModalOpen] = useState(false);
  const [editingEnv, setEditingEnv] = useState<EnvironmentRow | null>(null);
  const [envForm, setEnvForm] = useState<EnvFormState>(emptyEnvForm);
  const [envSubmitting, setEnvSubmitting] = useState(false);
  const [envFormError, setEnvFormError] = useState<string | null>(null);

  const loadApps = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [appData, deptData] = await Promise.all([
        apiJson<ApplicationRow[]>("/api/applications"),
        apiJson<DepartmentOption[]>("/api/departments"),
      ]);
      setApps(appData);
      setDepartments(deptData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load applications");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadEnvs = useCallback(async (applicationId: string) => {
    setEnvLoading(true);
    try {
      const data = await apiJson<EnvironmentRow[]>(`/api/environments?applicationId=${applicationId}`);
      setEnvs(data);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to load environments");
      setEnvs([]);
    } finally {
      setEnvLoading(false);
    }
  }, []);

  useEffect(() => {
    loadApps();
  }, [loadApps]);

  useEffect(() => {
    if (managingApp) loadEnvs(managingApp.id);
  }, [managingApp, loadEnvs]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    setEnvPage(1);
  }, [envSearch]);

  const filteredApps = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = sortRows(apps, sortKey, sortDir);
    if (!q) return list;
    return list.filter(
      (row) =>
        row.name.toLowerCase().includes(q) ||
        row.department?.name?.toLowerCase().includes(q) ||
        row.type.toLowerCase().includes(q) ||
        row.criticality.toLowerCase().includes(q) ||
        row.productOwner.toLowerCase().includes(q) ||
        row.techLead.toLowerCase().includes(q)
    );
  }, [apps, search, sortKey, sortDir]);

  const appTotalPages = pageCount(filteredApps.length, DEFAULT_PAGE_SIZE);
  const appPageRows = paginateRows(filteredApps, page, DEFAULT_PAGE_SIZE);

  const filteredEnvs = useMemo(
    () => filterRows(envs, envSearch, ["name", "type", "owner", "status"]),
    [envs, envSearch]
  );
  const envTotalPages = pageCount(filteredEnvs.length, DEFAULT_PAGE_SIZE);
  const envPageRows = paginateRows(filteredEnvs, envPage, DEFAULT_PAGE_SIZE);

  const toggleSort = (key: AppSortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const openCreateApp = () => {
    setEditingApp(null);
    setAppForm({ ...emptyAppForm, departmentId: departments[0]?.id ?? "" });
    setAppFormError(null);
    setAppModalOpen(true);
  };

  const openEditApp = (row: ApplicationRow) => {
    setEditingApp(row);
    setAppForm({
      name: row.name,
      departmentId: row.departmentId,
      type: row.type,
      productOwner: row.productOwner,
      techLead: row.techLead,
      support: row.support,
      criticality: row.criticality,
    });
    setAppFormError(null);
    setAppModalOpen(true);
  };

  const handleAppSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appForm.name.trim() || !appForm.departmentId) {
      setAppFormError("Name and department are required");
      return;
    }
    setAppSubmitting(true);
    setAppFormError(null);
    try {
      if (editingApp) {
        await apiJson(`/api/applications/${editingApp.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(appForm),
        });
      } else {
        await apiJson("/api/applications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(appForm),
        });
      }
      setAppModalOpen(false);
      await loadApps();
    } catch (err) {
      setAppFormError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setAppSubmitting(false);
    }
  };

  const handleDeleteApp = async (row: ApplicationRow) => {
    if (!confirm(`Delete application "${row.name}"?`)) return;
    try {
      await apiJson(`/api/applications/${row.id}`, { method: "DELETE" });
      await loadApps();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const openCreateEnv = () => {
    setEditingEnv(null);
    setEnvForm(emptyEnvForm);
    setEnvFormError(null);
    setEnvModalOpen(true);
  };

  const openEditEnv = (row: EnvironmentRow) => {
    setEditingEnv(row);
    setEnvForm({ name: row.name, type: row.type, owner: row.owner, status: row.status });
    setEnvFormError(null);
    setEnvModalOpen(true);
  };

  const handleEnvSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!managingApp || !envForm.name.trim()) {
      setEnvFormError("Name is required");
      return;
    }
    setEnvSubmitting(true);
    setEnvFormError(null);
    try {
      if (editingEnv) {
        await apiJson(`/api/environments/${editingEnv.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...envForm, applicationId: managingApp.id }),
        });
      } else {
        await apiJson("/api/environments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...envForm, applicationId: managingApp.id }),
        });
      }
      setEnvModalOpen(false);
      await loadEnvs(managingApp.id);
      await loadApps();
    } catch (err) {
      setEnvFormError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setEnvSubmitting(false);
    }
  };

  const handleDeleteEnv = async (row: EnvironmentRow) => {
    if (!confirm(`Delete environment "${row.name}"?`)) return;
    try {
      await apiJson(`/api/environments/${row.id}`, { method: "DELETE" });
      if (managingApp) await loadEnvs(managingApp.id);
      await loadApps();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Delete failed");
    }
  };

  if (managingApp) {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        <button
          type="button"
          onClick={() => setManagingApp(null)}
          className="flex items-center gap-2 text-[14px] font-semibold text-[#2548C9] mb-4 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Applications
        </button>

        <div className="flex items-center justify-between gap-4 mb-4">
          <TopBar
            title={`Environments — ${managingApp.name}`}
            subtitle={`${envs.length} environment instances`}
          />
          <button
            type="button"
            onClick={openCreateEnv}
            className="shrink-0 rounded-lg bg-[#2548C9] px-5 py-2.5 text-[14px] font-semibold text-white hover:bg-[#1E3A9F]"
          >
            Add Environment
          </button>
        </div>

        <MasterDataTableShell>
          <BrowseToolbar
            search={envSearch}
            onSearchChange={setEnvSearch}
            page={envPage}
            totalPages={envTotalPages}
            totalRows={filteredEnvs.length}
            pageSize={DEFAULT_PAGE_SIZE}
            onPageChange={setEnvPage}
          />
          {envLoading ? (
            <MasterDataLoading />
          ) : filteredEnvs.length === 0 ? (
            <MasterDataEmptyState entityLabel="environments" addLabel="Add Environment" onAdd={openCreateEnv} />
          ) : (
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/50">
                  <th className={thClass}>Env Name</th>
                  <th className={thClass}>Type</th>
                  <th className={thClass}>Owner</th>
                  <th className={thClass}>Status</th>
                  <th className={`${thClass} text-right`}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {envPageRows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className={`${tdClass} font-semibold`}>{row.name}</td>
                    <td className={tdClass}>{row.type}</td>
                    <td className={tdClass}>{row.owner || "—"}</td>
                    <td className={tdClass}>
                      <StatusPill value={row.status} />
                    </td>
                    <td className={`${tdClass} text-right`}>
                      <RowActionsMenu onEdit={() => openEditEnv(row)} onDelete={() => handleDeleteEnv(row)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </MasterDataTableShell>

        <FormModal
          open={envModalOpen}
          title={editingEnv ? "Edit Environment" : "Add Environment"}
          onClose={() => setEnvModalOpen(false)}
          onSubmit={handleEnvSubmit}
          submitting={envSubmitting}
        >
          {envFormError && <p className="text-[13px] text-red-600">{envFormError}</p>}
          <FormField label="Name" required>
            <input className={inputClass} value={envForm.name} onChange={(e) => setEnvForm((f) => ({ ...f, name: e.target.value }))} />
          </FormField>
          <FormField label="Type" required>
            <input className={inputClass} value={envForm.type} onChange={(e) => setEnvForm((f) => ({ ...f, type: e.target.value }))} />
          </FormField>
          <FormField label="Owner">
            <input className={inputClass} value={envForm.owner} onChange={(e) => setEnvForm((f) => ({ ...f, owner: e.target.value }))} />
          </FormField>
          <FormField label="Status">
            <select className={inputClass} value={envForm.status} onChange={(e) => setEnvForm((f) => ({ ...f, status: e.target.value }))}>
              <option value="Available">Available</option>
              <option value="Active">Active</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Unavailable">Unavailable</option>
            </select>
          </FormField>
        </FormModal>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-4">
        <TopBar title="Applications" subtitle={`${apps.length} applications in catalog`} />
        <button
          type="button"
          onClick={openCreateApp}
          className="shrink-0 rounded-lg bg-[#2548C9] px-5 py-2.5 text-[14px] font-semibold text-white hover:bg-[#1E3A9F]"
        >
          Add Application
        </button>
      </div>

      {error && <MasterDataError message={error} onRetry={loadApps} />}

      <MasterDataTableShell>
        <BrowseToolbar
          search={search}
          onSearchChange={setSearch}
          page={page}
          totalPages={appTotalPages}
          totalRows={filteredApps.length}
          pageSize={DEFAULT_PAGE_SIZE}
          onPageChange={setPage}
        />
        {loading ? (
          <MasterDataLoading />
        ) : filteredApps.length === 0 ? (
          <MasterDataEmptyState entityLabel="applications" addLabel="Add Application" onAdd={openCreateApp} />
        ) : (
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/50">
                <SortableTh label="Name" active={sortKey === "name"} dir={sortDir} onClick={() => toggleSort("name")} />
                <th className={thClass}>Department</th>
                <SortableTh label="Type" active={sortKey === "type"} dir={sortDir} onClick={() => toggleSort("type")} />
                <SortableTh label="Criticality" active={sortKey === "criticality"} dir={sortDir} onClick={() => toggleSort("criticality")} />
                <SortableTh label="Product Owner" active={sortKey === "productOwner"} dir={sortDir} onClick={() => toggleSort("productOwner")} />
                <SortableTh label="Tech Lead" active={sortKey === "techLead"} dir={sortDir} onClick={() => toggleSort("techLead")} />
                <th className={thClass}>Env Count</th>
                <th className={`${thClass} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {appPageRows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className={`${tdClass} font-semibold text-gray-900 max-w-[200px]`}>{row.name}</td>
                  <td className={tdClass}>{row.department?.name ?? "—"}</td>
                  <td className={tdClass}>{row.type}</td>
                  <td className={tdClass}>{row.criticality}</td>
                  <td className={tdClass}>{row.productOwner}</td>
                  <td className={tdClass}>{row.techLead}</td>
                  <td className={tdClass}>{row._count?.environments ?? 0}</td>
                  <td className={`${tdClass} text-right`}>
                    <RowActionsMenu
                      extraItems={[{ label: "Manage Environments", onClick: () => setManagingApp(row) }]}
                      onEdit={() => openEditApp(row)}
                      onDelete={() => handleDeleteApp(row)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </MasterDataTableShell>

      <FormModal
        open={appModalOpen}
        title={editingApp ? "Edit Application" : "Add Application"}
        onClose={() => setAppModalOpen(false)}
        onSubmit={handleAppSubmit}
        submitting={appSubmitting}
      >
        {appFormError && <p className="text-[13px] text-red-600">{appFormError}</p>}
        <FormField label="Name" required>
          <input className={inputClass} value={appForm.name} onChange={(e) => setAppForm((f) => ({ ...f, name: e.target.value }))} />
        </FormField>
        <FormField label="Department" required>
          <select className={inputClass} value={appForm.departmentId} onChange={(e) => setAppForm((f) => ({ ...f, departmentId: e.target.value }))}>
            <option value="">Select department</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Type">
          <input className={inputClass} value={appForm.type} onChange={(e) => setAppForm((f) => ({ ...f, type: e.target.value }))} />
        </FormField>
        <FormField label="Product Owner">
          <input className={inputClass} value={appForm.productOwner} onChange={(e) => setAppForm((f) => ({ ...f, productOwner: e.target.value }))} />
        </FormField>
        <FormField label="Tech Lead">
          <input className={inputClass} value={appForm.techLead} onChange={(e) => setAppForm((f) => ({ ...f, techLead: e.target.value }))} />
        </FormField>
        <FormField label="Support">
          <input className={inputClass} value={appForm.support} onChange={(e) => setAppForm((f) => ({ ...f, support: e.target.value }))} />
        </FormField>
        <FormField label="Criticality">
          <select className={inputClass} value={appForm.criticality} onChange={(e) => setAppForm((f) => ({ ...f, criticality: e.target.value }))}>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>
        </FormField>
      </FormModal>
    </div>
  );
}
