"use client";

import { CalendarClock } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export type ScheduleItem = {
  id: string;
  title: string;
  subtitle?: string;
  time: string;
  status?: string;
  href?: string;
  avatarLabel?: string;
};

type MeetingScheduleListProps = {
  items: ScheduleItem[];
  title?: string;
  subheader?: string;
  emptyMessage?: string;
};

function getStatusColors(status?: string) {
  if (!status) return "bg-brand-50 text-brand-600";
  const s = status.toLowerCase();
  if (s.includes("go") || s.includes("ready") || s.includes("approved")) return "bg-emerald-50 text-emerald-600";
  if (s.includes("risk") || s.includes("pending") || s.includes("undecided")) return "bg-amber-50 text-amber-600";
  if (s.includes("block") || s.includes("no-go") || s.includes("fail")) return "bg-error-50 text-error-600";
  return "bg-blue-50 text-blue-600";
}

export function MeetingScheduleList({
  items,
  title = "Meeting Schedule",
  subheader = "Go/No-Go and upcoming release checkpoints",
  emptyMessage = "No upcoming checkpoints in scope.",
}: MeetingScheduleListProps) {
  return (
    <div className="flex h-full flex-col rounded-xl border border-[var(--border)] bg-white shadow-level-1">
      <div className="border-b border-[var(--border)] p-5">
        <h3 className="text-headline-sm text-gray-900">{title}</h3>
        {subheader && <p className="mt-0.5 text-sm text-gray-500">{subheader}</p>}
      </div>

      <div className="flex-1 p-2">
        {items.length === 0 ? (
          <p className="p-4 text-sm text-gray-500">{emptyMessage}</p>
        ) : (
          <ul className="flex flex-col">
            {items.map((item) => {
              const content = (
                <div className="group flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-gray-50">
                  <div
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xs font-bold uppercase",
                      getStatusColors(item.status)
                    )}
                  >
                    {item.avatarLabel ?? <CalendarClock className="h-5 w-5" />}
                  </div>
                  <div className="flex-1 min-w-0 py-0.5">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold text-gray-900 group-hover:text-brand-600 transition-colors">
                        {item.title}
                      </p>
                      {item.status && (
                        <span className="shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-gray-600">
                          {item.status}
                        </span>
                      )}
                    </div>
                    {item.subtitle && (
                      <p className="mt-0.5 truncate text-xs text-gray-500">{item.subtitle}</p>
                    )}
                    <p className="mt-1 text-xs font-medium text-brand-600">{item.time}</p>
                  </div>
                </div>
              );

              return (
                <li key={item.id}>
                  {item.href ? (
                    <Link href={item.href} className="block outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-lg">
                      {content}
                    </Link>
                  ) : (
                    content
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
