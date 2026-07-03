"use client";

import { useMemo } from "react";
import { ProgressLink } from "@/components/layout/NavigationProgress";
import type { UnifiedRelease } from "@/lib/unified-releases";
import { cn } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  Planned: "bg-blue-500",
  Scheduled: "bg-blue-500",
  "In Progress": "bg-brand-500",
  Ready: "bg-brand-500",
  Blocked: "bg-error-500",
  "At Risk": "bg-amber-500",
  Complete: "bg-success-500",
  Shipped: "bg-success-500",
};

export function MonthGridCalendar({
  events,
  viewDate,
}: {
  events: any[];
  viewDate: Date;
}) {
  const { gridDays } = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    
    const firstDay = new Date(year, month, 1).getDay(); // 0 (Sun) to 6 (Sat)
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const totalCells = firstDay + daysInMonth;
    const paddingAfter = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
    
    const prevMonthDays = new Date(year, month, 0).getDate();
    const blankBefore = Array.from({ length: firstDay }, (_, i) => {
      const d = new Date(year, month - 1, prevMonthDays - firstDay + i + 1);
      // Format as local YYYY-MM-DD
      const offset = d.getTimezoneOffset() * 60000;
      const localISOTime = new Date(d.getTime() - offset).toISOString().split("T")[0];
      return { date: d, isCurrentMonth: false, dayStr: localISOTime };
    });
    
    const monthDays = Array.from({ length: daysInMonth }, (_, i) => {
      const d = new Date(year, month, i + 1);
      const offset = d.getTimezoneOffset() * 60000;
      const localISOTime = new Date(d.getTime() - offset).toISOString().split("T")[0];
      return { date: d, isCurrentMonth: true, dayStr: localISOTime };
    });
    
    const blankAfter = Array.from({ length: paddingAfter }, (_, i) => {
      const d = new Date(year, month + 1, i + 1);
      const offset = d.getTimezoneOffset() * 60000;
      const localISOTime = new Date(d.getTime() - offset).toISOString().split("T")[0];
      return { date: d, isCurrentMonth: false, dayStr: localISOTime };
    });
    
    return {
      gridDays: [...blankBefore, ...monthDays, ...blankAfter],
    };
  }, [viewDate]);

  // Group events by date string (YYYY-MM-DD)
  const eventsByDate = useMemo(() => {
    const map = new Map<string, any[]>();
    events.forEach((r) => {
      const d = new Date(r.date);
      const offset = d.getTimezoneOffset() * 60000;
      const localISOTime = new Date(d.getTime() - offset).toISOString().split("T")[0];
      if (!map.has(localISOTime)) map.set(localISOTime, []);
      map.get(localISOTime)!.push(r);
    });
    return map;
  }, [events]);

  const todayStr = useMemo(() => {
    const d = new Date();
    const offset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - offset).toISOString().split("T")[0];
  }, []);

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-theme-sm overflow-hidden">
      {/* Header Row */}
      <div className="grid grid-cols-7 border-b border-gray-200 bg-white">
        {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((day) => (
          <div key={day} className="px-2 py-3 text-center text-[10px] font-bold text-gray-500 tracking-wider border-r border-gray-100 last:border-r-0">
            {day}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 bg-gray-100 gap-px border-b border-gray-200">
        {gridDays.map((cell, idx) => {
          const dayEvents = eventsByDate.get(cell.dayStr) || [];
          
          return (
            <div
              key={idx}
              className={cn(
                "min-h-[140px] bg-white p-2 flex flex-col transition-colors hover:bg-gray-50/50 relative",
                !cell.isCurrentMonth && "bg-gray-50/30"
              )}
            >
              <div className="flex justify-start relative z-10">
                <span className={cn(
                  "text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full",
                  cell.isCurrentMonth ? "text-gray-900" : "text-gray-400",
                  cell.dayStr === todayStr && "bg-brand-500 text-white"
                )}>
                  {cell.date.getDate()}
                </span>
              </div>
              
              <div className="mt-1 space-y-1 relative z-10 flex-1">
                {dayEvents.map((r) => {
                  let colorClass = "bg-gray-400";
                  let bgClass = "bg-gray-50/80";
                  let borderClass = "border-gray-100";
                  let textClass = "text-gray-700";
                  
                  if (r.eventType === "RELEASE") {
                    colorClass = "bg-brand-500";
                  } else if (r.eventType === "CAB MEETING") {
                    colorClass = "bg-amber-500";
                  } else if (r.eventType === "CHANGE FREEZE") {
                    colorClass = "bg-error-500";
                    bgClass = "bg-error-50/80";
                    borderClass = "border-error-200";
                    textClass = "text-error-800";
                  } else if (r.eventType === "REGULATORY") {
                    colorClass = "bg-purple-500";
                  } else if (r.eventType === "VENDOR MAINT") {
                    colorClass = "bg-blue-500";
                  }
                  
                  const isLink = !!r.releaseId;
                  
                  return (
                    <div
                      key={r.id}
                      title={r.title}
                      className={cn(
                        "block px-1.5 py-1 rounded border text-[10px] font-medium truncate transition-colors cursor-default",
                        bgClass,
                        borderClass,
                        textClass,
                        !cell.isCurrentMonth && "opacity-70",
                        isLink && "hover:border-gray-300 hover:bg-white cursor-pointer"
                      )}
                      onClick={() => isLink && r.releaseId ? window.location.href = `/releases/${r.releaseId}` : null}
                    >
                      <span className={cn("inline-block w-1.5 h-1.5 rounded-full mr-1.5", colorClass)} />
                      {r.title}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
