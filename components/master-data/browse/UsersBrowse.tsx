"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Mail } from "lucide-react";
import { formatDate } from "@/lib/utils";
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

type UserRow = {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: string;
  department: string;
  manager: string | null;
  accessLevel: string;
  status: string;
  lastLogin: string | null;
};

type FormState = {
  name: string;
  email: string;
  role: string;
  department: string;
  manager: string;
  accessLevel: string;
  status: string;
};

const emptyForm: FormState = {
  name: "",
  email: "",
  role: "Developer",
  department: "",
  manager: "",
  accessLevel: "Standard",
  status: "Active",
};

type UserSortKey = "name" | "email" | "role" | "department" | "accessLevel" | "status";

export function UsersBrowse() {
  const [rows, setRows] = useState<UserRow[]>([]);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<UserSortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [users, depts] = await Promise.all([
        apiJson<UserRow[]>("/api/users"),
        apiJson<DepartmentOption[]>("/api/departments"),
      ]);
      setRows(users);
      setDepartments(depts);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const filtered = useMemo(
    () => filterRows(sortRows(rows, sortKey, sortDir), search, ["name", "email", "role", "department", "accessLevel", "status"]),
    [rows, search, sortKey, sortDir]
  );
  const totalPages = pageCount(filtered.length, DEFAULT_PAGE_SIZE);
  const pageRows = paginateRows(filtered, page, DEFAULT_PAGE_SIZE);

  const toggleSort = (key: UserSortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, department: departments[0]?.name ?? "" });
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (row: UserRow) => {
    setEditing(row);
    setForm({
      name: row.name,
      email: row.email,
      role: row.role,
      department: row.department,
      manager: row.manager ?? "",
      accessLevel: row.accessLevel,
      status: row.status,
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      setFormError("Name and email are required");
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      const payload = {
        ...form,
        manager: form.manager || null,
      };
      if (editing) {
        await apiJson(`/api/users/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await apiJson("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (row: UserRow) => {
    if (!confirm(`Delete user "${row.name}"?`)) return;
    try {
      await apiJson(`/api/users/${row.id}`, { method: "DELETE" });
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Delete failed");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-4">
        <TopBar title="Users" subtitle={`${rows.length} release stakeholders and approvers`} />
        <button
          type="button"
          onClick={openCreate}
          className="shrink-0 rounded-lg bg-[#2548C9] px-5 py-2.5 text-[14px] font-semibold text-white hover:bg-[#1E3A9F]"
        >
          Add User
        </button>
      </div>

      {error && <MasterDataError message={error} onRetry={load} />}

      <MasterDataTableShell>
        <BrowseToolbar
          search={search}
          onSearchChange={setSearch}
          page={page}
          totalPages={totalPages}
          totalRows={filtered.length}
          pageSize={DEFAULT_PAGE_SIZE}
          onPageChange={setPage}
        />
        {loading ? (
          <MasterDataLoading />
        ) : filtered.length === 0 ? (
          <MasterDataEmptyState entityLabel="users" addLabel="Add User" onAdd={openCreate} />
        ) : (
          <table className="w-full text-left border-collapse min-w-[1100px]">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/50">
                <SortableTh label="Name" active={sortKey === "name"} dir={sortDir} onClick={() => toggleSort("name")} />
                <SortableTh label="Email" active={sortKey === "email"} dir={sortDir} onClick={() => toggleSort("email")} />
                <SortableTh label="Role" active={sortKey === "role"} dir={sortDir} onClick={() => toggleSort("role")} />
                <SortableTh label="Department" active={sortKey === "department"} dir={sortDir} onClick={() => toggleSort("department")} />
                <SortableTh label="Access Level" active={sortKey === "accessLevel"} dir={sortDir} onClick={() => toggleSort("accessLevel")} />
                <SortableTh label="Status" active={sortKey === "status"} dir={sortDir} onClick={() => toggleSort("status")} />
                <th className={thClass}>Last Login</th>
                <th className={`${thClass} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pageRows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className={tdClass}>
                    <div className="flex items-center gap-3">
                      <Avatar name={row.name} size="sm" />
                      <span className="font-semibold text-gray-900">{row.name}</span>
                    </div>
                  </td>
                  <td className={tdClass}>
                    <span className="flex items-center gap-1.5 text-gray-600">
                      <Mail className="h-3 w-3 shrink-0" /> {row.email}
                    </span>
                  </td>
                  <td className={tdClass}>
                    <StatusPill value={row.role} />
                  </td>
                  <td className={tdClass}>{row.department}</td>
                  <td className={tdClass}>{row.accessLevel}</td>
                  <td className={tdClass}>
                    <StatusPill value={row.status} />
                  </td>
                  <td className={`${tdClass} text-gray-500`}>
                    {row.lastLogin ? formatDate(row.lastLogin) : "—"}
                  </td>
                  <td className={`${tdClass} text-right`}>
                    <RowActionsMenu onEdit={() => openEdit(row)} onDelete={() => handleDelete(row)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </MasterDataTableShell>

      <FormModal
        open={modalOpen}
        title={editing ? "Edit User" : "Add User"}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        submitting={submitting}
      >
        {formError && <p className="text-[13px] text-red-600">{formError}</p>}
        <FormField label="Name" required>
          <input className={inputClass} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        </FormField>
        <FormField label="Email" required>
          <input type="email" className={inputClass} value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
        </FormField>
        <FormField label="Role">
          <input className={inputClass} value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} />
        </FormField>
        <FormField label="Department">
          <select className={inputClass} value={form.department} onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}>
            <option value="">Select department</option>
            {departments.map((d) => (
              <option key={d.id} value={d.name}>{d.name}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Manager">
          <input className={inputClass} value={form.manager} onChange={(e) => setForm((f) => ({ ...f, manager: e.target.value }))} />
        </FormField>
        <FormField label="Access Level">
          <select className={inputClass} value={form.accessLevel} onChange={(e) => setForm((f) => ({ ...f, accessLevel: e.target.value }))}>
            <option value="Standard">Standard</option>
            <option value="Elevated">Elevated</option>
            <option value="Admin">Admin</option>
          </select>
        </FormField>
        <FormField label="Status">
          <select className={inputClass} value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </FormField>
      </FormModal>
    </div>
  );
}
