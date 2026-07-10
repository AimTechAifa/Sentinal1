"use client";

/**
 * Public local diagnostic page for sidebar hover-expand.
 * Desktop hover pushes content (no overlay bleed). Mobile uses the drawer.
 * No Clerk session required.
 */
import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { ThemeModeProvider } from "@/context/ThemeModeContext";
import { cn } from "@/lib/utils";

type PageId = "calendar" | "dependencies" | "releases";

function FakeHeavyPage({ title, page }: { title: string; page: PageId }) {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">{title}</h1>
        <p className="mt-1 text-sm text-gray-500">
          Diagnostic content — if any of this text is readable through the peeked sidebar, the overlay is broken.
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Filters</p>
        <div className="flex flex-wrap gap-2">
          {(page === "calendar"
            ? ["All Statuses", "All Types", "All Days", "All Size / Impact", "All Applications"]
            : page === "dependencies"
              ? ["All Systems", "All Owners", "All Criticality", "All Status"]
              : ["All Statuses", "All Departments", "All Environments", "Search releases"]
          ).map((label) => (
            <button
              key={label}
              type="button"
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {page === "calendar" ? (
        <div className="grid grid-cols-7 gap-2 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          {Array.from({ length: 35 }).map((_, i) => (
            <div
              key={i}
              className="flex h-20 flex-col rounded-lg border border-gray-100 bg-gray-50 p-2 text-xs text-gray-600"
            >
              <span className="font-semibold">{i + 1}</span>
              <span className="mt-1 truncate">Release block {i + 1}</span>
              <span className="truncate text-gray-400">Calendar cell content</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Owner</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Updated</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 12 }).map((_, i) => (
                <tr key={i} className="border-t border-gray-100">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {page === "dependencies" ? `Dependency ${i + 1}` : `Release REL-2026-${100 + i}`}
                  </td>
                  <td className="px-4 py-3 text-gray-600">Team {String.fromCharCode(65 + (i % 5))}</td>
                  <td className="px-4 py-3 text-gray-600">{i % 2 ? "At Risk" : "On Track"}</td>
                  <td className="px-4 py-3 text-gray-500">2026-07-{String(i + 1).padStart(2, "0")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function TestInner() {
  const [page, setPage] = useState<PageId>("calendar");
  const titles: Record<PageId, string> = {
    calendar: "Calendar",
    dependencies: "Release Dependencies",
    releases: "Releases",
  };

  return (
    <>
      <div className="mb-4 flex flex-wrap gap-2">
        {(Object.keys(titles) as PageId[]).map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setPage(id)}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-xs font-semibold",
              page === id
                ? "border-brand-500 bg-brand-50 text-brand-700"
                : "border-gray-200 bg-white text-gray-600"
            )}
          >
            Simulate {titles[id]}
          </button>
        ))}
      </div>
      <FakeHeavyPage title={titles[page]} page={page} />
    </>
  );
}

export default function SidebarPeekTestPage() {
  return (
    <ThemeModeProvider>
      <AppShell>
        <TestInner />
      </AppShell>
    </ThemeModeProvider>
  );
}
