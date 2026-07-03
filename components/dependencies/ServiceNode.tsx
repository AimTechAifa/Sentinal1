"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import { cn } from "@/lib/utils";
import { CheckCircle2, Box, AlertTriangle, XCircle } from "lucide-react";

export interface ServiceNodeData {
  label: string;
  code: string;
  statusType: "stable" | "staging" | "critical" | "blocked";
  versionStr: string;
  selected?: boolean;
}

const statusConfig = {
  stable: {
    color: "bg-success-500",
    text: "text-success-600",
    icon: CheckCircle2,
  },
  staging: {
    color: "bg-brand-500",
    text: "text-brand-600",
    icon: Box,
  },
  critical: {
    color: "bg-warning-600",
    text: "text-warning-700",
    icon: AlertTriangle,
  },
  blocked: {
    color: "bg-error-500",
    text: "text-error-600",
    icon: XCircle,
  },
};

function ServiceNodeComponent({ data }: NodeProps<ServiceNodeData>) {
  const config = statusConfig[data.statusType] || statusConfig.stable;
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "relative rounded-xl bg-white px-5 py-4 w-[220px] transition-all shadow-theme-sm border border-gray-200 cursor-pointer",
        data.selected && "ring-2 ring-brand-500 ring-offset-2 border-brand-300 shadow-theme-md",
        !data.selected && "hover:shadow-theme-md hover:border-gray-300"
      )}
    >
      {/* Top Accent Line */}
      <div className={cn("absolute top-4 left-5 h-[3px] w-8 rounded-full", config.color)} />
      
      {/* Handles */}
      <Handle type="target" position={Position.Left} className="!opacity-0 !w-4 !h-4 !-left-2" />
      <Handle type="source" position={Position.Right} className="!opacity-0 !w-4 !h-4 !-right-2" />
      
      {/* Content */}
      <div className="mt-4">
        <div className="text-[10px] font-semibold text-gray-400 tracking-wide mb-1 uppercase font-mono">
          {data.code}
        </div>
        <div className="text-sm font-bold text-gray-900 leading-tight mb-3">
          {data.label}
        </div>
        
        <div className="flex items-center gap-1.5 mt-2">
          <Icon className={cn("w-3.5 h-3.5", config.text)} strokeWidth={3} />
          <span className="text-[11px] font-medium text-gray-600 tracking-wide">
            {data.versionStr}
          </span>
        </div>
      </div>
    </div>
  );
}

export const ServiceNode = memo(ServiceNodeComponent);
