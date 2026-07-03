"use client";

import { memo } from "react";
import { type NodeProps } from "reactflow";
import { cn } from "@/lib/utils";
import { Building2 } from "lucide-react";

export interface DepartmentNodeData {
  label: string;
  width: number;
  height: number;
}

function DepartmentNodeComponent({ data, selected }: NodeProps<DepartmentNodeData>) {
  return (
    <div
      className={cn(
        "relative rounded-2xl bg-gray-50/50 transition-all border-2 border-dashed",
        selected ? "border-brand-400 bg-brand-50/30" : "border-gray-200"
      )}
      style={{
        width: data.width,
        height: data.height,
      }}
    >
      {/* Header Label */}
      <div className="absolute -top-3 left-4 flex items-center gap-1.5 px-3 py-1 bg-white border border-gray-200 rounded-lg shadow-sm z-10">
        <Building2 className="w-3.5 h-3.5 text-brand-600" />
        <span className="text-[10px] font-bold text-gray-700 tracking-wider uppercase">
          {data.label}
        </span>
      </div>
    </div>
  );
}

export const DepartmentNode = memo(DepartmentNodeComponent);
