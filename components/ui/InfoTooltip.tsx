"use client";

import { useEffect, useId, useRef, useState } from "react";
import { CircleHelp } from "lucide-react";
import { useHoverCapable } from "@/hooks/useHoverCapable";
import { cn } from "@/lib/utils";

type InfoTooltipProps = {
  text: string;
  className?: string;
  /** Accessible name for the trigger button. */
  label?: string;
  /** Optional custom trigger; defaults to CircleHelp icon. */
  children?: React.ReactNode;
  /** Preferred placement of the tip relative to the trigger. */
  placement?: "top" | "bottom";
};

/**
 * Shared info tip: hover-to-show on fine pointers, tap-to-toggle on touch.
 * Escape / outside click dismisses the open tip.
 */
export function InfoTooltip({
  text,
  className,
  label = "More information",
  children,
  placement = "top",
}: InfoTooltipProps) {
  const [open, setOpen] = useState(false);
  const hoverCapable = useHoverCapable();
  const rootRef = useRef<HTMLDivElement>(null);
  const tipId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div
      ref={rootRef}
      className={cn("relative inline-flex shrink-0", className)}
      onMouseEnter={() => {
        if (hoverCapable) setOpen(true);
      }}
      onMouseLeave={() => {
        if (hoverCapable) setOpen(false);
      }}
    >
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        aria-describedby={open ? tipId : undefined}
        onClick={() => {
          if (!hoverCapable) setOpen((v) => !v);
        }}
        onFocus={() => {
          if (hoverCapable) setOpen(true);
        }}
        onBlur={(e) => {
          if (!hoverCapable) return;
          if (!rootRef.current?.contains(e.relatedTarget as Node)) {
            setOpen(false);
          }
        }}
        className="inline-flex h-6 w-6 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 dark:text-white/40 dark:hover:bg-white/10 dark:hover:text-white/70"
      >
        {children ?? <CircleHelp size={14} strokeWidth={2} />}
      </button>
      {open && (
        <div
          id={tipId}
          role="tooltip"
          className={cn(
            "absolute left-1/2 z-50 w-max max-w-[min(280px,calc(100vw-2rem))] -translate-x-1/2 rounded-lg border border-gray-200 bg-[var(--card)] px-4 py-3 text-left text-xs leading-snug text-[var(--foreground)] shadow-[0_8px_24px_-8px_rgba(0,0,0,0.25)] dark:border-[var(--border)]",
            placement === "top" ? "bottom-full mb-2" : "top-full mt-2"
          )}
        >
          {text}
        </div>
      )}
    </div>
  );
}
