"use client";

import { Calendar, ChevronDown, List, MoreVertical, Plus, Table2, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

import { useEffect, useState } from "react";

export default function BookingPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/bookings")
      .then((r) => r.json())
      .then((d) => setBookings(d))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 pb-12 font-sans max-w-[1200px] mx-auto overflow-x-hidden">
      {/* Header Section */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[28px] font-bold text-[#111827] tracking-tight">Environment Booking</h1>
          <p className="mt-1 text-[15px] text-gray-600 font-medium">Manage and schedule deployments across all infrastructure layers.</p>
        </div>
      </div>

      {/* Recent & Upcoming Bookings Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 border-b border-gray-100 p-5">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-brand-50 text-brand-600">
            <Table2 className="h-5 w-5" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">Database Bookings</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50 text-[11px] font-bold uppercase tracking-widest text-gray-500">
                <th className="px-5 py-4 font-bold whitespace-nowrap">Booked By</th>
                <th className="px-5 py-4 font-bold whitespace-nowrap">Team</th>
                <th className="px-5 py-4 font-bold whitespace-nowrap">From</th>
                <th className="px-5 py-4 font-bold whitespace-nowrap">To</th>
                <th className="px-5 py-4 font-bold whitespace-nowrap">Booking ID</th>
                <th className="px-5 py-4 font-bold whitespace-nowrap">Release ID</th>
                <th className="px-5 py-4 font-bold whitespace-nowrap">Application</th>
                <th className="px-5 py-4 font-bold whitespace-nowrap">Department</th>
                <th className="px-5 py-4 font-bold whitespace-nowrap">Release Size</th>
                <th className="px-5 py-4 font-bold whitespace-nowrap">Prod Release Date</th>
                <th className="px-5 py-4 font-bold whitespace-nowrap">CAB Date</th>
                <th className="px-5 py-4 font-bold whitespace-nowrap">Test Env</th>
                <th className="px-5 py-4 font-bold whitespace-nowrap">Test Start</th>
                <th className="px-5 py-4 font-bold whitespace-nowrap">Test End</th>
                <th className="px-5 py-4 font-bold whitespace-nowrap">Test Days</th>
                <th className="px-5 py-4 font-bold whitespace-nowrap">UAT Env</th>
                <th className="px-5 py-4 font-bold whitespace-nowrap">UAT Start</th>
                <th className="px-5 py-4 font-bold whitespace-nowrap">UAT End</th>
                <th className="px-5 py-4 font-bold whitespace-nowrap">UAT Days</th>
                <th className="px-5 py-4 font-bold whitespace-nowrap">Pre-Prod Env</th>
                <th className="px-5 py-4 font-bold whitespace-nowrap">Pre-Prod Start</th>
                <th className="px-5 py-4 font-bold whitespace-nowrap">Pre-Prod End</th>
                <th className="px-5 py-4 font-bold whitespace-nowrap">Pre-Prod Days</th>
                <th className="px-5 py-4 font-bold whitespace-nowrap">Conflict Flag</th>
                <th className="px-5 py-4 font-bold whitespace-nowrap">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={25} className="p-4 text-center text-gray-500">Loading...</td></tr>
              ) : bookings.length === 0 ? (
                <tr><td colSpan={25} className="p-4 text-center text-gray-500">No data found.</td></tr>
              ) : bookings.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-5 py-4 text-gray-600 whitespace-nowrap">{row.bookedBy ?? "—"}</td>
                  <td className="px-5 py-4 text-gray-600 whitespace-nowrap">{row.team ?? "—"}</td>
                  <td className="px-5 py-4 text-gray-600 whitespace-nowrap">{row.fromDate ? new Date(row.fromDate).toISOString().split('T')[0] : "—"}</td>
                  <td className="px-5 py-4 text-gray-600 whitespace-nowrap">{row.toDate ? new Date(row.toDate).toISOString().split('T')[0] : "—"}</td>
                  <td className="px-5 py-4 text-gray-900 whitespace-nowrap font-mono text-xs">{row.id.slice(0, 8)}…</td>
                  <td className="px-5 py-4 font-semibold text-brand-600 whitespace-nowrap">{row.release?.releaseCode ?? "—"}</td>
                  <td className="px-5 py-4 text-gray-600 whitespace-nowrap">{row.application?.name ?? "—"}</td>
                  <td className="px-5 py-4 text-gray-600 whitespace-nowrap">{row.application?.department?.name ?? row.departmentName ?? "—"}</td>
                  <td className="px-5 py-4 text-gray-600 whitespace-nowrap">{row.releaseSize ?? "—"}</td>
                  <td className="px-5 py-4 text-gray-600 whitespace-nowrap">{row.prodReleaseDate ? new Date(row.prodReleaseDate).toISOString().split('T')[0] : "—"}</td>
                  <td className="px-5 py-4 text-gray-600 whitespace-nowrap">{row.cabDate ? new Date(row.cabDate).toISOString().split('T')[0] : "—"}</td>
                  <td className="px-5 py-4 text-gray-600 whitespace-nowrap">{row.testEnvCode ?? "—"}</td>
                  <td className="px-5 py-4 text-gray-600 whitespace-nowrap">{row.testStart ? new Date(row.testStart).toISOString().split('T')[0] : "—"}</td>
                  <td className="px-5 py-4 text-gray-600 whitespace-nowrap">{row.testEnd ? new Date(row.testEnd).toISOString().split('T')[0] : "—"}</td>
                  <td className="px-5 py-4 text-gray-600 whitespace-nowrap">{row.testDays ?? "—"}</td>
                  <td className="px-5 py-4 text-gray-600 whitespace-nowrap">{row.uatEnvCode ?? "—"}</td>
                  <td className="px-5 py-4 text-gray-600 whitespace-nowrap">{row.uatStart ? new Date(row.uatStart).toISOString().split('T')[0] : "—"}</td>
                  <td className="px-5 py-4 text-gray-600 whitespace-nowrap">{row.uatEnd ? new Date(row.uatEnd).toISOString().split('T')[0] : "—"}</td>
                  <td className="px-5 py-4 text-gray-600 whitespace-nowrap">{row.uatDays ?? "—"}</td>
                  <td className="px-5 py-4 text-gray-600 whitespace-nowrap">{row.preProdEnvCode ?? "—"}</td>
                  <td className="px-5 py-4 text-gray-600 whitespace-nowrap">{row.preProdStart ? new Date(row.preProdStart).toISOString().split('T')[0] : "—"}</td>
                  <td className="px-5 py-4 text-gray-600 whitespace-nowrap">{row.preProdEnd ? new Date(row.preProdEnd).toISOString().split('T')[0] : "—"}</td>
                  <td className="px-5 py-4 text-gray-600 whitespace-nowrap">{row.preProdDays ?? "—"}</td>
                  <td className="px-5 py-4 font-medium whitespace-nowrap text-error-600">{row.conflictFlag ? "⚠️ CONFLICT" : "—"}</td>
                  <td className="px-5 py-4 text-gray-600 truncate max-w-[200px]" title={row.purpose ?? ""}>{row.purpose === "Testing" ? "—" : (row.purpose ?? "—")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
