"use client";

import { Bot, GitCommit, Shield, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export type ActivityItem = {
  id: string;
  title: string;
  description: string;
  time: string;
  type?: "agent" | "release" | "security" | "demo";
};

const typeIcon = {
  agent: Bot,
  release: GitCommit,
  security: Shield,
  demo: Sparkles,
};

type ActivityFeedCardProps = {
  items: ActivityItem[];
  title?: string;
  subheader?: string;
};

export function ActivityFeedCard({
  items,
  title = "Activity Timeline",
  subheader = "Recent agent and release desk events",
}: ActivityFeedCardProps) {
  return (
    <div className="flex h-full flex-col rounded-xl border border-[var(--border)] bg-white shadow-sm">
      <div className="border-b border-[var(--border)] p-5">
        <h3 className="text-headline-sm text-gray-900">{title}</h3>
        {subheader && <p className="mt-0.5 text-sm text-gray-500">{subheader}</p>}
      </div>

      <div className="flex-1 p-5 pt-6">
        <div className="relative">
          {/* Vertical Line */}
          <div className="absolute left-[11px] top-2 bottom-6 w-px bg-gray-200" />
          
          <ul className="flex flex-col gap-6">
            {items.map((item) => {
              const Icon = typeIcon[item.type ?? "release"];
              const colorClass = 
                item.type === "agent" ? "bg-brand-50 text-brand-600" :
                item.type === "security" ? "bg-error-50 text-error-600" :
                item.type === "demo" ? "bg-blue-50 text-blue-600" :
                "bg-emerald-50 text-emerald-600";
                
              return (
                <li key={item.id} className="relative flex items-start">
                  {/* Timeline Node (In flow) */}
                  <div className={cn(
                    "relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ring-[6px] ring-white mt-0.5",
                    colorClass
                  )}>
                    <Icon className="h-3 w-3" strokeWidth={2.5} />
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 pb-1 ml-4">
                    <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                    <p className="mt-0.5 text-xs text-gray-500">{item.description}</p>
                    <p className="mt-1.5 text-[11px] font-medium text-gray-400">{item.time}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
