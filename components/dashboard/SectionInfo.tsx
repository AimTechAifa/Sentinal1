"use client";

import Tooltip from "@mui/material/Tooltip";
import { CircleHelp } from "lucide-react";
import { cn } from "@/lib/utils";

export function SectionInfo({ text, className }: { text: string; className?: string }) {
  return (
    <Tooltip
      title={text}
      arrow
      placement="top"
      slotProps={{
        tooltip: {
          sx: {
            maxWidth: 280,
            fontSize: "12px",
            lineHeight: 1.45,
            bgcolor: "var(--card)",
            color: "var(--foreground)",
            border: "1px solid",
            borderColor: "divider",
            boxShadow: "0 8px 24px -8px rgba(0,0,0,0.25)",
          },
        },
      }}
    >
      <button
        type="button"
        aria-label="Section information"
        className={cn(
          "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:text-white/40 dark:hover:bg-white/10 dark:hover:text-white/70",
          className
        )}
      >
        <CircleHelp size={14} strokeWidth={2} />
      </button>
    </Tooltip>
  );
}
