"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import { ProgressLink } from "@/components/layout/NavigationProgress";
import type { KgNodeType } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface KgNodeData {
  label: string;
  sublabel?: string;
  nodeType: KgNodeType;
  href?: string;
  meta?: Record<string, string>;
  selected?: boolean;
}

const styles: Record<KgNodeType, { bg: string; border: string; text: string }> = {
  person: { bg: "#ECFDF5", border: "#10B981", text: "#047857" },
  release: { bg: "#EEF2FF", border: "#465fff", text: "#3730A3" },
  service: { bg: "#DBEAFE", border: "#2563EB", text: "#1D4ED8" },
  ticket: { bg: "#FFFBEB", border: "#F59E0B", text: "#B45309" },
  change: { bg: "#F5F3FF", border: "#8B5CF6", text: "#6D28D9" },
  incident: { bg: "#FEF2F2", border: "#EF4444", text: "#B91C1C" },
};

function KgNodeComponent({ data }: NodeProps<KgNodeData>) {
  const s = styles[data.nodeType];
  const inner = (
    <div
      className={cn(
        "rounded-lg px-3 py-2 min-w-[120px] max-w-[160px] shadow-sm relative",
        data.nodeType === "service" && "cursor-pointer hover:shadow-md transition-shadow",
        data.selected && "ring-2 ring-brand-500 ring-offset-1"
      )}
      style={{ background: s.bg, border: `2px solid ${s.border}` }}
    >
      <p className="text-xs font-semibold truncate" style={{ color: s.text }}>
        {data.label}
      </p>
      {data.sublabel && <p className="text-[10px] text-gray-500 truncate mt-0.5">{data.sublabel}</p>}
      {data.meta?.status && (
        <span className="text-[9px] mt-1 inline-block px-1.5 py-0.5 rounded bg-white/70 text-gray-600">
          {data.meta.status}
        </span>
      )}
      {data.meta?.unstable === "true" && (
        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500 animate-pulseDot" />
      )}
      <Handle type="target" position={Position.Left} className="!w-2 !h-2 !bg-gray-400 !border-0" />
      <Handle type="source" position={Position.Right} className="!w-2 !h-2 !bg-gray-400 !border-0" />
    </div>
  );

  if (data.href) {
    return (
      <ProgressLink href={data.href} className="relative block">
        {inner}
      </ProgressLink>
    );
  }

  return <div className="relative">{inner}</div>;
}

export const KgNode = memo(KgNodeComponent);
