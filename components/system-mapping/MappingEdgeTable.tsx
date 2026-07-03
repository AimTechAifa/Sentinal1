"use client";

import type { MappingEdgeRow } from "@/lib/system-mapping-types";

export function MappingEdgeTable({ edges }: { edges: MappingEdgeRow[] }) {
  if (!edges.length) {
    return <p className="text-sm text-gray-500">No mapping edges.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-100">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50/80 text-left text-xs uppercase tracking-wide text-gray-500">
            <th className="px-4 py-2.5 font-medium">Source</th>
            <th className="px-4 py-2.5 font-medium">Target</th>
            <th className="px-4 py-2.5 font-medium">Direction</th>
            <th className="px-4 py-2.5 font-medium">Notes</th>
          </tr>
        </thead>
        <tbody>
          {edges.map((e, i) => (
            <tr key={e.id ?? i} className="border-b border-gray-50 last:border-0">
              <td className="px-4 py-3 font-medium text-gray-800">
                {e.sourceApp?.name ?? "?"} / {e.sourceEnv?.name ?? "?"}
              </td>
              <td className="px-4 py-3 font-medium text-gray-800">
                {e.targetApp?.name ?? "?"} / {e.targetEnv?.name ?? "?"}
              </td>
              <td className="px-4 py-3 capitalize text-gray-600">{e.direction}</td>
              <td className="px-4 py-3 text-gray-600">{e.notes ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
